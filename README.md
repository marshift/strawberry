# strawberry
javascript function patcher, hard-fork of [spitroast](//github.com/Cumcord/spitroast).

## usage
```js
// ESM
import * as strawberry from "@marshift/strawberry";

// CJS
const strawberry = require("@marshift/strawberry");

const exampleObject = { myFunction: () => {} };

// Patches that run before the original function
strawberry.before(exampleObject, "myFunction", (args) => { // `args` is an array of arguments passed to the original function
	console.log("Before");

	// You can modify `args` directly, or return an array to replace the original arguments
}, false); // Changing the second argument to true here  would make the patch one-time, meaning it would unpatch after being called once

exampleObject.myFunction(); // logs "Before"

// Patches that run after the original function
strawberry.after(exampleObject, "myFunction", (args, ret) => { // `ret` is the return value of the original function
	console.log("After");

	// You can modify `ret` directly, or return something to replace the original return value
});

// Patches that replace the original function
const unpatch = strawberry.instead(exampleObject, "myFunction", (args, orig) => { // `orig` is the original function itself
	console.log("Instead");
});

// Scoped patches via the Patcher class
const patcher = new strawberry.Patcher();
patcher.after(exampleObject, "myFunction", (args, ret) => {
	console.log("Scoped after");
});

// Patches inherit context from the original function, just use `this` as normal

exampleObject.myFunction(); // Patches stack - This logs "Before", "Instead", "After", "Scoped after"

// Unpatches are as simple as calling the return value of the patch function
unpatch(); // Now if you call the function it'll log just "Before" and "After"

// You can unpatch all patches within a scoped Patcher
patcher.unpatchAll();

// You can also unpatch EVERY patch, but be careful with this!
strawberry.unpatchAll();
```
