# dx-js
dx libaray

**This libaray is for simplifying the native javascript. It includes selector, ajax, json method, etc.**

For Example:

[native]
```
document.getElementByID("a");
document.querySelector(".b");
var d = document.createElement("div");

//create an element with attributes
var obj = document.createElement("div");
obj.id = "abc";
obj.innerHTML = "context here.";

```
equals to :

[dx]
```
getdom("#a");
getdom(".b");
newdom("div");

//create an element with attributes By Chains
var obj = newdom("div").attr("id","abc").html("context here.");

```