# dx-js
dx libaray

**This libaray is for simplifying the native javascript. It includes selector, ajax, json method, etc.**

For Example:

[native]
```
var a = document.getElementByID("a");
var b = document.querySelector(".b");
var d = document.createElement("div");

//create an element with attributes
var obj = document.createElement("div");
obj.id = "abc";
obj.innerHTML = "context here.";

```
equals to:

[dx]
```
var a = getdom("#a");
var b = getdom(".b");
var d = newdom("div");

//create an element with attributes By Chains
var obj = newdom("div").attr("id","abc").html("context here.");

//Add <Script> & <Style>
addScript("js/test.js");
addStyle("{color:red;}","mainStyle"); //add style in <style id="mainStyle"></style>

```
**jQL**
*jQL makes you can use SQL-like method to handle the json data*

For example:
```
jQL({json data}).sum([column name]);
```

**supported method**
1. sum(x) //sum
2. sumproduct(x1,x2,x3...) //sumproduct
3. keys() //get column names
4. vals(x) //get all values in a columns
5. concat(x1,x2,x3...) //concat
6. concatText(t) //concatText
