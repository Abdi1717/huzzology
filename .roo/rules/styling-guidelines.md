---
description: 
globs: 
alwaysApply: true
---

# CODEBASE STYLING GUIDELINES

You MUST follow these coding guidelines when adding ANY code to the codebase
## 1. Types
- Symbols and BigInts cannot be faithfully polyfilled, so they should not be used when targeting browsers/environments that don’t support them natively.

## 2. References
- Use `const` for all of your references; avoid using `var`.
- If you must reassign references, use `let` instead of `var`.
- Note that both `let` and `const` are block-scoped, whereas `var` is function-scoped.

## 3. Objects
- Use the literal syntax for object creation.
- Use computed property names when creating objects with dynamic property names.
- Use object method shorthand.
- Use property value shorthand.
- Group your shorthand properties at the beginning of your object declaration.
- Only quote properties that are invalid identifiers.
- Do not call `Object.prototype` methods directly (e.g., `hasOwnProperty`). Prefer `Object.prototype.hasOwnProperty.call(object, key)` or `Object.hasOwn(object, key)`.
- Prefer the object spread syntax over `Object.assign` to shallow-copy objects.
- Use the object rest parameter syntax to get a new object with certain properties omitted.

## 4. Arrays
- Use the literal syntax for array creation.
- Use `Array#push` instead of direct assignment to add items to an array.
- Use array spreads `...` to copy arrays.
- To convert an iterable object to an array, use spreads `...` instead of `Array.from`.
- Use `Array.from` for converting an array-like object to an array.
- Use `Array.from` instead of spread `...` for mapping over iterables.
- Use return statements in array method callbacks. It’s ok to omit the return if the function body consists of a single statement returning an expression without side effects.
- Use line breaks after opening array brackets and before closing array brackets if an array has multiple lines.

## 5. Destructuring
- Use object destructuring when accessing and using multiple properties of an object.
- Use array destructuring.
- Use object destructuring for multiple return values, not array destructuring.

## 6. Strings
- Use single quotes `''` for strings.
- Strings that cause the line to go over 100 characters should not be written across multiple lines using string concatenation.
- When programmatically building up strings, use template strings instead of concatenation.
- Never use `eval()` on a string.
- Do not unnecessarily escape characters in strings.

## 7. Functions
- Use named function expressions instead of function declarations.
- Wrap immediately invoked function expressions in parentheses.
- Never declare a function in a non-function block (`if`, `while`, etc). Assign the function to a variable instead.
- Never name a parameter `arguments`.
- Never use `arguments`, opt to use rest syntax `...` instead.
- Use default parameter syntax rather than mutating function arguments.
- Avoid side effects with default parameters.
- Always put default parameters last.
- Never use the Function constructor to create a new function.
- Ensure consistent spacing in function signatures: include a space before the parameter parentheses and before the opening curly brace.
- Never mutate parameters.
- Never reassign parameters.
- Prefer the use of the spread syntax `...` to call variadic functions.
- Functions with multiline signatures, or invocations, should be indented with each item on a line by itself, with a trailing comma on the last item.

## 8. Arrow Functions
- When you must use an anonymous function (as when passing an inline callback), use arrow function notation.
- If the function body consists of a single statement returning an expression without side effects, omit the braces and use the implicit return. Otherwise, keep the braces and use a `return` statement.
- In case the expression spans over multiple lines, wrap it in parentheses for better readability.
- Always include parentheses around arguments for clarity and consistency.
- Avoid confusing arrow function syntax (`=>`) with comparison operators (`<=`, `>=`); wrap the expression in parentheses if necessary.
- For arrow functions with implicit returns, the body should either be on the same line as the arrow (`=>`) or wrapped in parentheses if multiline.

## 9. Classes & Constructors
- Always use `class`. Avoid manipulating `prototype` directly.
- Use `extends` for inheritance.
- Methods can return `this` to help with method chaining.
- It’s okay to write a custom `toString()` method, just make sure it works successfully and causes no side effects.
- An empty constructor function or one that just delegates to a parent class is unnecessary.
- Avoid duplicate class members.
- Class methods should use `this` or be made into a static method unless an external library or framework requires using specific non-static methods.

## 10. Modules
- Always use modules (`import`/`export`) over a non-standard module system.
- Do not use wildcard imports.
- Do not export directly from an import.
- Only import from a path in one place.
- Do not export mutable bindings.
- In modules with a single export, prefer default export over named export.
- Put all `import`s above non-import statements.
- Multiline imports should be indented just like multiline array and object literals, with a trailing comma.
- Disallow Webpack loader syntax in module import statements.
- Do not include JavaScript filename extensions in `import` statements.

## 11. Iterators and Generators
- Don’t use iterators. Prefer JavaScript’s higher-order functions (`map()`, `every()`, `filter()`, `find()`, `findIndex()`, `reduce()`, `some()`, etc.) instead of loops like `for-in` or `for-of`.
- Use `Object.keys()`, `Object.values()`, or `Object.entries()` to produce arrays from objects for iteration.
- Don’t use generators for now.
- If using generators, ensure proper spacing: `function* foo()` or `const foo = function* () {}`.

## 12. Properties
- Use dot notation when accessing properties.
- Use bracket notation `[]` when accessing properties with a variable.
- Use exponentiation operator `**` when calculating exponentiations.

## 13. Variables
- Always use `const` or `let` to declare variables.
- Use one `const` or `let` declaration per variable or assignment.
- Group all your `const`s and then group all your `let`s.
- Assign variables where you need them, but place them in a reasonable place.
- Don’t chain variable assignments.
- Avoid using unary increments and decrements (`++`, `--`). Prefer `num += 1` or `num -= 1`.
- Avoid linebreaks before or after `=` in an assignment. If your assignment violates max-len, surround the value in parens.
- Disallow unused variables.

## 14. Hoisting
- Variables, classes, and functions should be defined before they can be used.

## 15. Comparison Operators & Equality
- Use `===` and `!==` over `==` and `!=`.
- Use shortcuts for booleans (e.g., `if (isValid)`) but explicit comparisons for strings (e.g., `name !== ''`) and numbers (e.g., `collection.length > 0`).
- Use braces to create blocks in `case` and `default` clauses that contain lexical declarations (e.g. `let`, `const`, `function`, and `class`).
- Ternaries should not be nested and generally be single line expressions.
- Avoid unneeded ternary statements (prefer `||`, `!!`, `!`, `??`).
- When mixing operators, enclose them in parentheses. Exceptions: standard arithmetic operators (`+`, `-`, `**`). Enclose `/` and `*` when mixed.
- Use the nullish coalescing operator (`??`) to provide defaults specifically for `null` or `undefined` values.

## 16. Blocks
- Use braces with all multiline blocks.
- If you’re using multiline blocks with `if` and `else`, put `else` on the same line as your `if` block’s closing brace.
- If an `if` block always executes a `return` statement, the subsequent `else` block is unnecessary. A `return` in an `else if` block following an `if` block that contains a `return` can be separated into multiple `if` blocks.

## 17. Control Statements
- If a control statement (`if`, `while` etc.) gets too long or exceeds the maximum line length, each (grouped) condition can be put into a new line. The logical operator should begin the line.
- Don't use selection operators (e.g., `&&`, `||` for short-circuiting) in place of control statements (e.g., `if`).

## 18. Comments
- Use `/** ... */` for multiline comments.
- Use `//` for single line comments.
- Place single line comments on a newline above the subject of the comment.
- Put an empty line before the comment unless it’s on the first line of a block.
- Start all comments with a space.
- Use `// FIXME:` to annotate problems.
- Use `// TODO:` to annotate solutions to problems.

## 19. Whitespace
- Use soft tabs (space character) set to 2 spaces for indentation.
- Place 1 space before the leading brace.
- Place 1 space before the opening parenthesis in control statements (`if`, `while` etc.).
- Place no space between the argument list and the function name in function calls and declarations.
- Set off operators with spaces.
- End files with a single newline character.
- Use indentation when making long method chains (more than 2 method chains). Use a leading dot.
- Leave a blank line after blocks and before the next statement.
- Do not pad blocks with blank lines.
- Do not use multiple consecutive blank lines.
- Do not add spaces inside parentheses.
- Do not add spaces inside array brackets `[]`.
- Add spaces inside curly braces `{}`.
- Avoid lines of code longer than 100 characters (including whitespace). Long strings are exempt.
- Require consistent spacing inside block tokens on the same line (e.g., `function foo() { return true; }`).
- Avoid spaces before commas and require a space after commas.
- Do not add spaces inside computed property brackets (e.g., `obj[foo]`).
- Avoid spaces between function names and their invocation parentheses (e.g., `func()`).
- Place a space after the colon in object literal properties, but no space before the colon (e.g., `{ foo: 42 }`).
- Avoid trailing spaces at the end of lines.
- Allow only one newline at the end of files. Avoid a newline at the beginning of files.

## 20. Commas
- Do not use leading commas.
- Use trailing commas in multiline arrays, objects, function parameters, and import/export lists.
- Do not use a trailing comma after a rest element (`...`).

## 21. Semicolons
- Always use semicolons to terminate statements.

## 22. Type Casting & Coercion
- Perform type coercion at the beginning of the statement.
- Strings: Use `String()` for type casting. Do not use `new String()`, string concatenation `+ ''`, or `.toString()`.
- Numbers: Use `Number()` for type casting. Use `parseInt()` always with a radix (usually 10) for parsing strings. Do not use `new Number()`.
- Booleans: Use `Boolean()` or the double bang `!!` for type casting. Do not use `new Boolean()`.

## 23. Naming Conventions
- Avoid single letter names. Be descriptive.
- Use camelCase when naming objects, functions, and instances.
- Use PascalCase only when naming constructors or classes.
- Do not use trailing or leading underscores.
- Don’t save references to `this` (like `self` or `that`). Use arrow functions or `Function#bind`.
- A base filename should exactly match the name of its default export.
- Use camelCase when you export-default a function. Your filename should be identical to your function’s name.
- Use PascalCase when you export a constructor / class / singleton / function library / bare object.
- Acronyms and initialisms should always be consistently all uppercased or all lowercased.
- You may optionally uppercase a constant only if it (1) is exported, (2) is a `const`, and (3) the programmer can trust it (and its nested properties) to never change. Do not uppercase constants within a file unless exported.

## 24. Accessors
- Accessor functions for properties are not required.
- Do not use JavaScript getters/setters. Instead, if you do make accessor functions, use `getVal()` and `setVal('hello')`.
- If the property/method is a `boolean`, use `isVal()` or `hasVal()` for accessor function names.
- It’s okay to create generic `get()` and `set()` functions, but be consistent if you do.

## 25. Events
- When attaching data payloads to events, pass an object literal (hash) instead of a raw value.

## 26. jQuery
- Prefix jQuery object variables with a `$`.
- Cache jQuery lookups.
- For DOM queries use Cascading selectors (`$('.sidebar ul')`) or parent > child selectors (`$('.sidebar > ul')`).
- Use `find` with scoped jQuery object queries (e.g., `$sidebar.find('ul')`).

## 27. ECMAScript 5 Compatibility
- (No specific guideline other than referencing compatibility tables).

## 28. ECMAScript 6+ (ES 2015+) Styles
- Do not use TC39 proposals that have not reached stage 3.

## 29. Standard Library
- Use `Number.isNaN` instead of global `isNaN`.
- Use `Number.isFinite` instead of global `isFinite`.

## 30. Testing
- Write tests.
- Strive to write many small pure functions, and minimize where mutations occur.
- Be cautious about stubs and mocks.
- 100% test coverage is a good goal to strive for.
- Whenever you fix a bug, write a regression test.
