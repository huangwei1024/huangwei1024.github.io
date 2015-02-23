---
layout: page
title: highlight2 Page
---

this is markdown!</br>

```python
def not_found():
    return None
```

```cpp
int main() {
    retrun 0;
}
```

```lua
require "extern"
require "util.print_r"
require "luastl.map"

CA = class("CA")
CB = class("CB")

function CB:ctor()
	print("CB:ctor")
end

function CB:retain( ... )
	print("CB:retain")
end

function CB:release( ... )
	print("CB:release")
end

function CA:ctor( ... )
	self.map = CMap.new()
	self.map:insert("xxx", CB.new())
	self.map:insert("xxx2", CB.new())
end

function CA:retain( ... )
	print("CA:retain")
end

function CA:release( ... )
	print("CA:release")

	for k, v in pairs(self) do
		print ("k=",k,"v=",v)
		if isRef(v) then v:release() end
	end
end

a = CA.new()
a:release()

```

```
def not_found():
    return None
```

~~~
def not_found():
    return None
~~~

~~~python
def not_found():
    return None
~~~

```
require "extern"
require "util.print_r"
require "luastl.map"

CA = class("CA")
CB = class("CB")

function CB:ctor()
	print("CB:ctor")
end

function CB:retain( ... )
	print("CB:retain")
end

function CB:release( ... )
	print("CB:release")
end

function CA:ctor( ... )
	self.map = CMap.new()
	self.map:insert("xxx", CB.new())
	self.map:insert("xxx2", CB.new())
end

function CA:retain( ... )
	print("CA:retain")
end

function CA:release( ... )
	print("CA:release")

	for k, v in pairs(self) do
		print ("k=",k,"v=",v)
		if isRef(v) then v:release() end
	end
end

a = CA.new()
a:release()

```