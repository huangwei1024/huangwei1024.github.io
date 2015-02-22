---
layout: post
title: Windows Socket IO 模型
categories: develop
tags:  socket, windows
description: Windows Socket IO 的所有模型。
keywords: windows, socket, io, iocp, select, overlapped, WSAEventSelect, WSAAsynSelect
---

##套接字架构
----------

![图1]({{ site.cdn.link }}/static/img/winsock1.gif)

应用程序使用Winsock与传输协议驱动沟通时AFD.SYS负责缓冲区的管理。这就意味着当一个程序调用send或者WSASend发送数据时，数据将被复制到AFD.SYS它自己的内部缓冲区中（依赖SO\_SNDBUF的设置）WSASend调用立即返回。然后AFD.SYS在程序后台将数据发送出去。当然，如果程序想要处理一个比SO\_SNDBUF设置的缓冲区需求更大的发送请求，WSASend的调用就会阻塞直到所有的数据都被发送出去。

类似的，从远程客户端接收数据时，只要SO_RCVBUF设置的缓冲区还没有满，AFD.SYS就会将数据复制进它自己的缓冲区直到所有的发送都已完成。当程序调用recv或者是WSARecv，数据就从AFD.SYS的缓冲区复制到了程序提供的缓冲区中了。

<!--more-->

使用Winsock的时候还会间接碰到另外两种资源的限制。第一个页面锁定的限制。注意重叠操作可能偶然性地以ERROR\_INSUFFICIENT\_RESOURCES调用失败，这基本上意味着有太多的发送和接收操作在等待中。另外一个限制是操作系统的非分页池（non-paged pool）的限制。

### 阻塞模型


<table>
<tr>
<td>

```cpp
int recv(
SOCKET s,
char* buf,
int len,
int flags
);	
```

</td>
<td>

```cpp
int send(
SOCKET s,
const char* buf,
int len,
int flags
);
```

</td>
</tr>
</table>


这种方式最为大家熟悉，Socket默认的就是阻塞模式。

在recv的时候，Socket会阻塞在那里，直到连接上有数据可读，把数据读到buffer里后recv函数才会返回，不然就会一直阻塞在那里。

如果在主线程中被阻塞，而数据迟迟没有过来，那么程序就会被锁死。这样的问题可以用多线程解决，但是在有多个套接字连接的情况下，这不是一个好的选择，扩展性很差，而且也容易有锁的问题。线程过多，也导致上下文切换过于频繁，导致系统变慢，而且大部分线程是处于非活动状态的话，这就大大浪费了系统的资源。

### 非阻塞模型

```cpp
int ioctlsocket(
IN SOCKET s,
IN long cmd,
IN OUT u_long FAR * argp
);
#define FIONBIO /* set/clear non-blocking i/o */
```

调用ioctlsocket函数设置FIONBIO为1就转为非阻塞模式。

当recv和send函数没有准备好数据时，函数不会阻塞，立即返回错误值，用GetLastError返回的错误码为WSAEWOULDBLOCK，中文解释为“无法立即完成一个非阻挡性套接字的操作”。

当然，这里你可以用非阻塞模拟阻塞模式，就是用while循环不停调用recv，直到recv返回成功为止。这样的效率也不高，但好处在于你能在没接收到数据时，有空进行其他操作，或者直接Sleep。

### Select模型

```
int select(
int nfds,
fd_set* readfds,
fd_set* writefds,
fd_set* exceptfds,
const struct timeval* timeout
);
```

Select模型是非阻塞的，函数内部自动检测WSAEWOULDBLOCK状态，还能有超时设定。对read，write，except三种事件进行分别检测，except指带外数据可读取，read和write的定义是广义的，accept，close等消息也纳入到read。

Select函数使用fd_set结构，它的结构非常的简单，只有一个数组和计数器。
Timeval结构里可以设置超时的时间。

Select函数返回值表示集合中有事件触发的sock总数，其余操作使用fd_set的宏来完成。

```
#ifndef FD_SETSIZE
#define FD_SETSIZE      64
#endif /* FD_SETSIZE */
typedef struct fd_set {
u_int fd_count;               /* how many are SET? */
SOCKET  fd_array[FD_SETSIZE];   /* an array of SOCKETs */
} fd_set;
FD_CLR(s, *set)
FD_ISSET(s, *set)
FD_SET(s, *set)
FD_ZERO(*set)
```

Select模型流程如下：

```
fd_set fdread;
timeval tv = {1, 0};
while (1) {
    // 初始化fd_set
    FD_ZERO(&fdread);
    for (int i = 0; i < nSock; i ++)
        FD_SET(socks[i], &fdread);
    // 等待事件触发，或超时返回
    int ret = select(0, &fdread, NULL, NULL, &tv);
    for (int i = 0; ret > 0 && i < nSock; i ++)
        // 检测哪个sock有事件触发
        if (FD_ISSET(socks[i], &fdread)) {
            read_buf(socks[i]);
            ret --;
        }
}
```

其实select的原理就是对sock集合进行扫描，有事件或者超时则退出，所以select的效率也是和sock数量成线性关系，而且需要我们自己循环检查哪个sock有事件发生。

它的优点是模型简单，过程清晰，容易管理，支持多个sock服务。缺点也很明显，本质还是个循环的改进版本，而且fd_set里最多只能放64个sock，还有它无法很好的支持sock事件的先后顺序。

### WSAAsynSelect模型

WSAAsynSelect是Windows特有的，可以在一个套接字上接收以Windows消息为基础的网络事件通知。该模型的实现方法是通过调用WSAAsynSelect函数自动将套接字设置（转变）为非阻塞模式，并向Windows注册一个或多个网络事件lEvent，并提供一个通知时使用的窗口句柄hWnd。当注册的事件发生时，对应的窗口将收到一个基于消息的通知wMsg。

```
int WSAAsyncSelect(
SOCKET s,
HWND hWnd,
unsigned int wMsg,
long lEvent
);
```

WSAAsyncSelect模型流程如下：

```
#define WM_SOCKET WM_USER+1
int WINAPI WinMain(HINSTANCE hINstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    SOCKET Listen;
    HWND Window;
    // 创建窗口，绑定上WinProc
    // 创建sock
    WSAStartup(…);
    Listen = Socket();
    bind(…);
    WSAAsyscSelect(Listen, Window, WM_SOCKET, FD_ACCEPT | FD_CLOSE);
    listen(Listen, 5);
}

BOOL CALLBACK WinProc(HWND hDlg, WORD wMsg, WORD wParam, DWORD lParam) {
    SOCKET Accept;
    switch(wMsg) {
        case WM_SOCKET:
        // lParam的高字节包含了可能出现的任何的错误代码
        // lParam的低字节指定已经发生的网络事件
        // 发生错误
        if(WSAGETSELECTERROR(lParam)) {
            closesocket…
        }
        // 事件触发
        switch( WSAGETSELECTEVENT(lParam) ) {
            case FD_ACCEPT:
            case FD_READ:
            case FD_WRITE:
        }
    }
}
```

WSAAsyncSelect是模仿Windows消息机制来实现的，使用起来很方便，仅仅只是在消息处理中加入了对WM_SOCKET的处理，这样就能严格得按先后顺序处理sock事件。

MFC中的CSOCKET也采用了这个模型。

lEvent事件表：

|Event|描述|
|:---|:---|
|FD\_READ|	应用程序想要接收有关是否可读的通知，以便读入数据|
|FD\_WRITE|	应用程序想要接收有关是否可写的通知，以便写入数据|
|FD\_OOB|	应用程序想接收是否有带外（OOB）数据抵达的通知|
|FD\_ACCEPT|	应用程序想接收与进入连接有关的通知|
|FD\_CONNECT|	应用程序想接收与一次连接或者多点join操作完成的通知|
|FD\_CLOSE|	应用程序想接收与套接字关闭有关的通知|
|FD\_QOS|	应用程序想接收套接字“服务质量”（QoS）发生更改的通知|
|FD\_GROUP\_QOS|	应用程序想接收套接字组“服务质量”发生更改的通知（现在没什么用处，为未来套接字组的使用保留）|
|FD\_ROUTING\_INTERFACE\_CHANGE|	应用程序想接收在指定的方向上，与路由接口发生变化的通知|
|FD\_ADDRESS\_LIST\_CHANGE|	应用程序想接收针对套接字的协议家族，本地地址列表发生变化的通知|

只有在以下3种条件下，会发送FD_WRITE事件：

- 使用connect。连接首次被建立。
- 使用accept。套接字被接受。
- 使用send，sendto。

它的缺点就是，每个sock事件处理需要一个窗口句柄，如果sock很多的情况下，资源和性能可想而知了。

### WSAEventSelect模型

WSAEventSelect模型类似WSAAsynSelect模型，但最主要的区别是网络事件发生时会被发送到一个Event对象句柄，而不是发送到一个窗口。这样你就可以使用Event对象的特性了。但WSAEventSelect模型明显复杂很多。

它需要由以下函数一起完成。

```
// 1. 创建事件对象来接收网络事件：
WSAEVENT WSACreateEvent( void );
// 2. 将事件对象与套接字关联，同时注册事件，使事件对象的工作状态从未传信转变未已传信。
int WSAEventSelect( SOCKET s,WSAEVENT hEventObject,long lNetworkEvents );
// 3. I/O处理后，设置事件对象为未传信
BOOL WSAResetEvent( WSAEVENT hEvent );
// 4. 等待网络事件来触发事件句柄的工作状态：
DWORD WSAWaitForMultipleEvents( DWORD cEvents,const WSAEVENT FAR * lphEvents, BOOL fWaitAll,DWORD dwTimeout, BOOLfAlertable );
// 5.  获取网络事件类型
int WSAEnumNetworkEvents( SOCKET s, WSAEVENT hEventObject, LPWSANETWORKEVENTS lpNetworkEvents );
```

WSACreateEvent其实跟CreateEvent的效果类似，返回的WSAEVENT类型其实就是HANDLE类型，所以可以直接使用CreateEvent创建特殊的Event。

sock和Event对象是对应的，当一个套接字有事件发生，WSAWaitForMultipleEvents返回相应的值，通过这个值来索引这个套接字。 但它也和select一样，在Event数组大小上也有限制，MAXIMUM_WAIT_OBJECTS的值为64。

有了Event对象的支持，signaled/non-signaled和manual reset/auto reset的概念也就可以应用到程序里，这样能使sock事件处理的方式比较丰富灵活。而且它也能严格按先后顺序处理sock事件。

闪电邮PushMail的处理就是WSAEventSelect模型。

### Over-Lapped IO模型

它和之前模型不同的是，使用重叠模型的应用程序通知缓冲区收发系统直接使用数据，也就是说，如果应用程序投递了一个10KB大小的缓冲区来接收数据，且数据已经到达套接字，则该数据将直接被拷贝到投递的缓冲区。之前的模型都是在套接字的缓冲区中，当通知应用程序接收后，在把数据拷贝到程序的缓冲区。

这种模型适用于除WindowsCE外的其他Windows平台，该模型是以Windows的重叠IO机制为基础，通过ReadFile和WriteFile，针对设备执行IO操作。

早先这种机制是用于文件IO，在Socket IO和文件IO统一接口之后，这种机制也被引入Socket IO。但这类模型的实现就相对复杂多了。

有两个方法可以实现重叠IO请求的完成情况（接到重叠操作完成的通知）：

- 事件对象通知（event object notification）。
- 完成例程（completion routines）。注意，这里并不是完成端口。

#### WSAOVERLAPPED

重叠结构是不得不提的，之后的完成端口模型也需要用到。这个结构等同于OVERLAPPED。

```
typedef struct _WSAOVERLAPPED {
DWORD Internal;
DWORD InternalHigh;
DWORD Offset;
DWORD OffsetHigh;
WSAEVENT hEvent; // 只关注这个参数，用来关联WSAEvent对象
} WSAOVERLAPPED, *LPWSAOVERLAPPED;
```

使用重叠结构，我们常用的send, sendto, recv, recvfrom也都要被WSASend, WSASendto, WSARecv, WSARecvFrom替换掉了，是因为它们的参数中都有一个Overlapped参数。

```
int WSARecv(
SOCKET s, // [in] 套接字
LPWSABUF lpBuffers, // [in,out] 接收缓冲区，WSABUF的数组
DWORD dwBufferCount, // [in] 数组中WSABUF的数量
LPDWORD lpNumberOfBytesRecvd, // [out] 此刻函数所接收到的字节数
LPDWORD lpFlags,             // [in,out] 这里设置为0 即可
LPWSAOVERLAPPED lpOverlapped,  // [in] 绑定重叠结构
LPWSAOVERLAPPED_COMPLETION_ROUTINE lpCompletionRoutine
// [in] 完成例程中将会用到的参数
);
```

没有错误且收取立刻完成时，返回值为0，否则是SOCKET_ERROR。常见的错误码是WSA_IO_PENDING，表示重叠操作正在进行。相应的其他函数也是类似参数，具体参考MDSN。

获取重叠操作的结果，由WSAWaitForMultipleEvents函数来完成。

```
BOOL WSAGetOverlappedResult(
SOCKET s, // [in] 套接字
LPWSAOVERLAPPED lpOverlapped, // [in] 要查询的重叠结构的指针
LPDWORD lpcbTransfer,// [out] 本次重叠操作的实际接收(或发送)的字节数
BOOL fWait, // [in] 设置为TRUE，除非重叠操作完成，否则函数不会返回
// 设置FALSE，而且操作仍处于挂起状态，那么函数就会返回FALSE，错误为WSA_IO_INCOMPLETE
LPDWORD lpdwFlags // [out] 负责接收结果标志
);
```

#### 事件通知

事件等待函数和WaitForMultipleObjects类似。

```
DWORD WSAWaitForMultipleEvents(
DWORD cEvents, // [in] 等候事件的总数量
const WSAEVENT* lphEvents, // [in] 事件数组的指针
BOOL fWaitAll, // [in] 是否等待所有事件
DWORD dwTimeout, // [in] 超时时间
BOOL fAlertable // [in] 在完成例程中会用到这个参数
);
```

返回值有这么几个：

|返回值|描述|
|---|---|
|WSA_WAIT_TIMEOUT|	超时，我们要继续Wait|
|WSA_WAIT_FAILED|	出现错误|
|WAIT_IO_COMPLETION|	一个或多个完成例程入队列执行|
|WSA_WAIT_EVENT_0 ~ (WSA_WAIT_EVENT_0 + cEvents – 1)|	触发的事件下标|

事件通知的重叠IO模型大致流程如下：

```
// 1. 建立并初始化buf和overlap
WSAOVERLAPPED Overlap;
WSABUF DataBuf;
char* SendBuf = new char[BufLen];
DWORD Flags = 0;
DataBuf.len = BufLen;
DataBuf.buf = SendBuf;
Overlap.hEvent = EventArray[dwEventTotal ++] = WSACreateEvent();
// 2. 在套接字上投递WSARecv请求
int ret = WSARecv(Sock, &DataBuf, 1, &NumberOfBytesRecvd,
&Flags, &Overlap, NULL);
if (ret == SOCKET_ERROR && WSAGetLastError() != WSA_IO_PENDING)
error_handle(…);
// 3. 等待事件通知
DWORD dwIndex = WSAWaitForMultipleEvents(dwEventTotal,EventArray,     FALSE, WSA_INFINITE, FALSE);
if (dwIndex == WSA_WAIT_FAILED || dwIndex == WSA_WAIT_TIMEOUT)
error_handle(…);
dwIndex -= WSA_WAIT_EVENT_0;
// 4. 重置事件对象
WSAResetEvent(EventArray[dwIndex]);
// 5. 取得重叠调用的返回状态
DWORD dwBytesTransferred;
WSAGetOverlappedResult(Sock, Overlap, &dwBytesTransferred, TRUE, &Flags);
if (dwBytesTransferred == 0)
closesocket(Sock);
dosomething(…);
```

如果是服务端使用事件通知模型，则需要再起一个线程来循环Wait事件通知，主线程则接受请求的连接。

实际编码过程中，要注意缓冲区不要搞错，因为全都需要自己来管理，稍有不慎就容易写脏数据和越界。还要注意WSARecv时，可能立即有数据返回的情况，即返回值为0且NumberOfBytesRecvd > 0。

#### 完成例程

完成例程（Completion Routine），不是完成端口。它是使用APC（Asynchronous Procedure Calls）异步回调函数来实现，大致流程和事件通知模型差不多，只不过WSARecv注册时，加上了lpCompletionRoutine参数。

```
Void CALLBACK CompletionROUTINE(
DWORD dwError, // [in] 标志咱们投递的重叠操作完成的状态
DWORD cbTransferred, // [in] 重叠操作期间，实际传输的字节量是多大
LPWSAOVERLAPPED lpOverlapped, // [in] 传递到最初IO调用的重叠结构
DWORD dwFlags  // [in] 返回操作结束时可能用的标志(一般没用)
);
```

但完成例程有一个比较隐晦的地方，就是APC机制本身。

##### APC机制

ReadFileEx / WriteFileEx在发出IO请求的同时，提供一个回调函数（APC过程），当IO请求完成后，一旦线程进入可告警状态，回调函数将会执行。

以下五个函数能够使线程进入告警状态：

```
SleepEx
WaitForSingleObjectEx
WaitForMultipleObjectsEx
SignalObjectAndWait
MsgWaitForMultipleObjectsEx
```

线程进入告警状态时，内核将会检查线程的APC队列，如果队列中有APC，将会按FIFO方式依次执行。如果队列为空，线程将会挂起等待事件对象。以后的某个时刻，一旦APC进入队列，线程将会被唤醒执行APC，同时等待函数返回WAIT_IO_COMPLETION。

![图2]({{ site.cdn.link }}/static/img/winsock2.jpg)

回到完成例程的话题上。

需要一个辅助线程，辅助线程的工作是判断有没有新的客户端连接被建立，如果有，就为那个客户端套接字激活一个异步的WSARecv操作，然后调用SleepEx使线程处于一种可警告的等待状态，以使得I/O完成后 CompletionROUTINE可以被内核调用，而CompletionROUTINE会在当初激活WSARecv异步操作的代码的同一个线程之内！而且调用SleepEx时，需要把bAlertable参数设为TRUE，这样当有APC唤醒时立即调用完成例程，否则例程就不会被执行。当然也可以使用WSAWaitForMultipleEvents函数，但这样就需要一个事件对象。

从图中就能看到CompletionROUTINE是在辅助线程（调用过WSARecv）里执行的。

### Completion Port模型

“完成端口”模型是迄今为止最为复杂的一种I/O模型。

假若一个应用程序同时需要管理为数众多的套接字，那么采用这种模型，往往可以达到最佳的系统性能！它能最大限度的减少上下文切换的同时最大限度的提高系统并发量。但不幸的是，该模型只适用于Windows NT和Windows 2000操作系统。

因其设计的复杂性，只有在你的应用程序需要同时管理数百乃至上千个套接字的时候，而且希望随着系统内安装的CPU数量的增多，应用程序的性能也可以线性提升，才应考虑采用“完成端口”模型。

要记住的一个基本准则是，假如要为Windows NT或Windows 2000开发高性能的服务器应用，同时希望为大量套接字I/O请求提供服务（Web服务器便是这方面的典型例子），那么I/O完成端口模型便是最佳选择！

完成端口是一种WINDOWS内核对象。完成端口用于异步方式的重叠I/O。简单地，可以把完成端口看成系统维护的一个队列，操作系统把重叠IO操作完成的事件通知放到该队列里，由于是暴露 “操作完成”的事件通知，所以命名为“完成端口”（Completion Ports）。

完成端口内部提供了线程池的管理，可以避免反复创建线程的开销，同时可以根据CPU的个数灵活的决定线程个数，而且可以让减少线程调度的次数从而提高性能。

![图3]({{ site.cdn.link }}/static/img/winsock3.gif)

它需要以下函数的支持，CreateIoCompletionPort函数用于创建和绑定完成端口。

```
HANDLE CreateIoCompletionPort(
HANDLE FileHandle, // [in] IO句柄对象，这里是套接字
HANDLE ExistingCompletionPort, // [in] 完成端口
ULONG_PTR CompletionKey, // [in] 自定义数据指针
DWORD NumberOfConcurrentThreads // [in] 最大线程数，0为自动
);
```

我们还需要类似WSAGetOverlappedResult的函数来获取完成端口的状态。

```
BOOL GetQueuedCompletionStatus(
HANDLE CompletionPort, // [in] 完成端口
LPDWORD lpNumberOfBytes, // [out] 此次IO操作的字节数
PULONG_PTR lpCompletionKey, // [out] 自定义数据指针，CreateIoCompletionPort初始化的
LPOVERLAPPED* lpOverlapped, // [out] 投递请求时的重叠结构指针
DWORD dwMilliseconds // [in] 超时设置
);
```

还有PostQueuedCompletionStatus函数，能模拟一个完成的重叠I/O操作。我们可以当成类似PostMessage的函数，以此控制工作线程。

```
BOOL PostQueuedCompletionStatus(
HANDLE CompletionPort, // [in] 完成端口
DWORD dwNumberOfBytesTransferred, // [in] 此次IO操作的字节数
ULONG_PTR dwCompletionKey, // [in] 自定义数据指针
LPOVERLAPPED lpOverlapped // [in] 重叠结构指针
);
```

完成端口模型大致流程如下：

```
// 1. 参数设空，就能创建完成端口
HANDLE CompletionPort = CreateIoCompletionPort(INVALID_HANDLE_VALUE,NULL,NULL,0);
// 2. 创建工作线程
DWORD dwThreadId;
SYSTEM_INFO sysinfo;
GetSystemInfo(&sysinfo);
for (int i = 0; i < sysinfo.dwNumberOfProcessors; i++)
CreateThread(NULL, 0, iocp_work_thread, CompletionPort, 0, &dwThreadId);
// 3. 建立并初始化buf和overlap（参照重叠IO）
// 4. 将套接字绑定到完成端口
CreateIoCompletionPort((HANDLE)Sock,CompletionPort,Sock,0);
// 5. 在套接字上投递WSARecv请求（参照重叠IO）
// 6. 在工作线程中取本次I/O的相关信息
GetQueuedCompletionStatus(CompletionPort,&dwBytesTransferred,
(DWORD*)&Sock,(LPOVERLAPPED*)&lpPerIOData,INFINITE);
if (dwBytesTransferred == 0)
closesocket(Sock);
dosomething(…);
```

## 测试图例
-------

来自于《Windows网络编程》的数据。

![图4]({{ site.cdn.link }}/static/img/winsock4.jpg)

阻塞模型难以应对大规模的客户连接，因为它在创建线程上耗费了太多的系统资源。因此，服务器创建太多的线程后，再调用CreateThread函数时，将返回ERROR_NOT_ENOUGH_MEMORY的错误，那些发出连接请求的客户则收到WSAECONNREFUSED的错误提示，表示连接的尝试被拒绝。其并发处理量是极难突破的。

非阻塞模型和Select模型的性能要比阻塞模式稍好，但是占用了太多的CPU处理时间。瓶颈在于，fd_set集合的线性扫描上。还需要注意的一个问题就是，非分页池（即直接在物理内存中分配的内存）的使用极高。这是因为AFD（Ancillary Function Driver,由afd.sys提供的支持Windows Sockets应用程序的底层驱动程序，其中运行在内核模式下afd.sys驱动程序主要管理Winsock TCP/IP通信）和TCP都将使用I/O缓存，因为服务器读取数据的速度是有限的，相对于CPU的处理速度而言，I/O基本是零字节的吞吐量。

基于Windows消息机制的WSAAsyncSelect模型能够处理一定的客户连接量，但是扩展性也不是很好。因为消息泵很快就会阻塞，降低了消息处理的速度。在几次测试中，服务器只能处理大约1/3的客户端连接。过多的客户端连接请求都将返回错误提示码WSAECONNREFUSED。上表中的数据可以发现，对那些已经建立的连接，其平均吞吐量也是极低的。

基于事件通知的WSAEventSelect模型表现得出奇的不错。在所有的测试中，大多数时候，服务器基本能够处理所有的客户连接，并且保持着较高的数据吞吐量。这种模型的缺点是，每当有一个新连接时，需要动态管理线程池，因为每个线程只能够等待64个事件对象。但最后，服务器不能再接受更多的连接，原因是WSAENOBUFS（无可用的缓冲区空间），套接字无法创建。另外，客户端程序也达到了极限，不能维持已经建立的连接。

事件通知的重叠I/O模型和WSAEventSelect模型在伸缩性上差不多。这两种模型都依赖于等待事件通知的线程池，处理客户通信时，大量线程上下文的切换是它们共同的制约因素。重叠I/O模型和WSAEventSelect模型的测试结果很相似，都表现得不错，直到线程数量超过极限。

例程通知的重叠I/O模型，性能和事件通知的重叠I/O模型相同，但因为以下几个原因，也不是开发高性能服务器的最佳选择。首先，许多扩展功能不允许使用APC完成通知。其次，由于APC在系统内部特有的处理机制，应用程序线程可能无限等待而得不到完成通知。当一个线程处于“可警告状态”时，所有挂起的APC按照先进先出的顺序（FIFO）接受处理。

完成端口模型的是所有I/O模型中性能最佳的。内存使用率（包括用户分页池和非分页池）基本差不多。真正不同的地方，在于对CPU的占用。完成端口模型只占用了60%的CPU，但是在维持同样规模的连接量时，另外两种模型（基于事件通知的重叠I/O模型和WSAEventSelect模型）占用更多的CPU。完成端口的另外一个明显的优势是，它维持更大的吞吐量。


## 总结
---------

### 客户端的选择

为了能在一定程度上提升性能，建议使用重叠IO模型或者WSAEventSelect模型。

如果是窗口程序，且socket不多的情况下，可以使用WSAAsyncSelect模型。

当然，如果性能啥的都不需要考虑的，那简洁的Select模式值得被考虑。

### 服务端的选择

既然是服务端，必然要需要性能不错的。

重叠IO模型可以使你在给定的时间段内同时控制多个套接字。

但是，如果服务器在任意时间里都有大量IO请求，那就用完成端口模型。

## 参考
-------

1. Windows核心编程;
2. 手把手教你玩转SOCKET模型之重叠I/O篇;
[http://dev.csdn.net/htmls/39/39122.html](http://dev.csdn.net/htmls/39/39122.html)
3. 手把手教你玩转网络编程模型之完成例程(Completion Routine)篇;
[http://blog.csdn.net/PiggyXP/archive/2009/02/19/3910726.aspx](http://blog.csdn.net/PiggyXP/archive/2009/02/19/3910726.aspx)
4. Windows Sockets 2.0: Write Scalable Winsock Apps Using Completion Ports;[http://msdn.microsoft.com/zh-cn/magazine/cc302334(en-us).aspx](http://msdn.microsoft.com/zh-cn/magazine/cc302334(en-us).aspx)
5. Inside I/O Completion Ports;[http://hi.baidu.com/jrckkyy/blog/item/401422527c131b070df3e37b.html](http://hi.baidu.com/jrckkyy/blog/item/401422527c131b070df3e37b.html)
6. Windows 2000 非分页池被 Afd.sys 耗尽;[http://support.microsoft.com/kb/296265/zh-cn](http://support.microsoft.com/kb/296265/zh-cn)
7. WinSock五种I/O模型的性能分析;[http://www.rover12421.com/2010/04/02/winsock%E4%BA%94%E7%A7%8Dio%E6%A8%A1%E5%9E%8B%E7%9A%84%E6%80%A7%E8%83%BD%E5%88%86%E6%9E%90.html](http://www.rover12421.com/2010/04/02/winsock%E4%BA%94%E7%A7%8Dio%E6%A8%A1%E5%9E%8B%E7%9A%84%E6%80%A7%E8%83%BD%E5%88%86%E6%9E%90.html)
