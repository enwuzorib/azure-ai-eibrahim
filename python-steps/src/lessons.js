/* Python Steps: Week 1 lessons ("Talking to Python") and the answer checker.
   Every example uses made-up facilities and stock numbers. Each step's solution is
   checked against real Python by tests/test-lessons.mjs. */
(function (root) {
  'use strict';

  const LESSONS = [
    {
      id: 'd1', day: 1, minutes: 10, title: 'Say hello with print()',
      idea: 'print() shows a message on the screen. It is how your program talks to you.',
      bridge: 'In a flow, you open the run history to see what a Compose action produced. In Python, print() does that job: it shows a value so you can see it.',
      steps: [
        {
          type: 'run', title: 'Run your first line',
          text: 'Tap **Run**. Python reads the line and shows the text inside the quotes.',
          code: 'print("Hello from Python")',
          check: { kind: 'ran' },
          explain: 'print() showed the text between the quotes. The quotes tell Python: this is text, show it exactly as written.',
        },
        {
          type: 'change', title: 'Make it yours',
          text: 'Change the words inside the quotes to anything you like, then tap **Run**. Keep both quote marks.',
          code: 'print("Hello from Python")',
          check: { kind: 'changed', from: 'Hello from Python' },
          hints: ['Only change the words between the two quote marks.', 'For example: `print("Good morning")`'],
          solution: 'print("Good morning")',
          explain: 'You changed the program and the output changed with it. That loop of change, run, look is how all coding works.',
        },
        {
          type: 'quiz', title: 'What will it show?',
          text: 'Look at the code. What will Python show?',
          code: 'print("2 + 3")',
          options: ['5', '2 + 3', 'An error'], answer: 1,
          explain: 'The quotes make it text, so Python shows it exactly as written. Without quotes, `print(2 + 3)` would do the maths and show 5.',
        },
        {
          type: 'fix', title: 'Fix the missing quote',
          text: 'This line has an error. Tap **Run** to see the message, then fix it so it shows: `Stock check complete`',
          code: 'print("Stock check complete)',
          check: { kind: 'exact', out: 'Stock check complete' },
          hints: ['Text needs a quote at the start and at the end.', 'Add `"` just before the closing bracket `)`.'],
          solution: 'print("Stock check complete")',
          explain: 'Every piece of text needs an opening and a closing quote. "Unterminated string literal" means the text never ended.',
        },
        {
          type: 'fix', title: 'Capital letters matter',
          text: 'Run this, read the error, then fix it so it shows: `Facility open`',
          code: 'Print("Facility open")',
          check: { kind: 'exact', out: 'Facility open' },
          hints: ['Python sees Print and print as two different names.', 'Change the capital P to a small p.'],
          solution: 'print("Facility open")',
          explain: 'Python is case-sensitive. print with a small p is the built-in command. Notice the error even suggested it: "Did you mean: \'print\'?"',
        },
        {
          type: 'write', title: 'Write two lines',
          text: 'Write two print() lines so the output is exactly:\n`Facility: Riverside PHC`\n`Status: Open`\nLines that start with # are notes for people. Python skips them.',
          code: '# Write your two lines below\n',
          check: { kind: 'exact', out: 'Facility: Riverside PHC\nStatus: Open' },
          hints: ['Each line of output needs its own print().', 'First line: `print("Facility: Riverside PHC")`'],
          solution: '# Write your two lines below\nprint("Facility: Riverside PHC")\nprint("Status: Open")',
          explain: 'Each print() starts a new line. Python runs your code from top to bottom, like the actions in a flow.',
        },
      ],
    },
    {
      id: 'd2', day: 2, minutes: 12, title: 'Variables: give a value a name',
      idea: 'A variable is a name that holds a value, so you can use it again later.',
      bridge: 'This is Initialize variable in Power Automate. `stock = 120` creates a variable called stock and puts 120 in it. Changing it later is like Set variable.',
      steps: [
        {
          type: 'run', title: 'Meet two variables',
          text: 'Read the code, then tap **Run**. There are no quotes around facility inside print(), because we want the value, not the word.',
          code: 'facility = "Riverside PHC"\nstock = 120\nprint(facility)\nprint(stock)',
          check: { kind: 'ran' },
          explain: 'facility and stock are variables. print(facility) shows the value stored in facility. Text values need quotes. Numbers don\'t.',
        },
        {
          type: 'change', title: 'Change the stock',
          text: 'Change 120 to any other number, then tap **Run**.',
          code: 'facility = "Riverside PHC"\nstock = 120\nprint(facility)\nprint(stock)',
          check: { kind: 'changed', from: 'Riverside PHC\n120' },
          hints: ['Only change the number on line 2.', 'For example: `stock = 95`'],
          solution: 'facility = "Riverside PHC"\nstock = 95\nprint(facility)\nprint(stock)',
          explain: 'You changed the value in one place and print() showed the new value. That is the point of variables.',
        },
        {
          type: 'quiz', title: 'Which value wins?',
          text: 'What will this show?',
          code: 'stock = 50\nstock = 80\nprint(stock)',
          options: ['50', '80', '50 and 80'], answer: 1,
          explain: 'The second line replaces the value, like Set variable in a flow. A variable holds one value at a time.',
        },
        {
          type: 'blank', title: 'Fill the blank',
          text: 'Replace `___` so the program shows: `ORS sachets`',
          code: 'item = ___\nprint(item)',
          check: { kind: 'exact', out: 'ORS sachets' },
          hints: ['It is text, so it needs quotes.', '`item = "ORS sachets"`'],
          solution: 'item = "ORS sachets"\nprint(item)',
          explain: 'You stored text in a variable. The quotes go around the value, never around the variable name.',
        },
        {
          type: 'fix', title: 'Same name, every time',
          text: 'Run this and read the error. Fix it so it shows: `Hilltop Clinic`',
          code: 'facility = "Hilltop Clinic"\nprint(Facility)',
          check: { kind: 'exact', out: 'Hilltop Clinic' },
          hints: ['Compare the name on line 1 with the name on line 2.', 'Make both names exactly the same: `facility`'],
          solution: 'facility = "Hilltop Clinic"\nprint(facility)',
          explain: 'Python treats facility and Facility as different names. The error message suggested the right one.',
        },
        {
          type: 'fix', title: 'Quotes or no quotes?',
          text: 'This shows the word district instead of its value. Fix it so it shows: `Central`',
          code: 'district = "Central"\nprint("district")',
          check: { kind: 'exact', out: 'Central' },
          hints: ['Quotes around a name turn it into plain text.', 'Remove the quotes: `print(district)`'],
          solution: 'district = "Central"\nprint(district)',
          explain: 'print("district") shows the text district. print(district) shows what the variable holds.',
        },
        {
          type: 'write', title: 'Your own variable',
          text: 'Create a variable called `item` that holds the text `Amoxicillin`, then print it.',
          code: '# Create the variable, then print it\n',
          check: { kind: 'exact', out: 'Amoxicillin', vars: { item: "'Amoxicillin'" } },
          hints: ['Two lines: one to create the variable, one to print it.', '`item = "Amoxicillin"` then `print(item)`'],
          solution: '# Create the variable, then print it\nitem = "Amoxicillin"\nprint(item)',
          explain: 'Create, then use. Python needs the variable to exist before the line that uses it.',
        },
      ],
    },
    {
      id: 'd3', day: 3, minutes: 12, title: 'Numbers and maths',
      idea: 'Python is a calculator that remembers. Use + - * / with numbers and variables.',
      bridge: 'Like the add(), sub(), mul() and div() expressions in Power Automate, but written with symbols: + - * /',
      steps: [
        {
          type: 'run', title: 'Work out a balance',
          text: 'Tap **Run**. Python does the subtraction and stores the answer.',
          code: 'received = 200\nissued = 75\nbalance = received - issued\nprint(balance)',
          check: { kind: 'ran' },
          explain: 'Python worked out received - issued and stored the answer in balance. No quotes, because these are numbers.',
        },
        {
          type: 'quiz', title: 'Dividing',
          text: 'What will this show?',
          code: 'print(10 / 2)',
          options: ['5', '5.0', '10 / 2'], answer: 1,
          explain: 'Division with / always gives a decimal number in Python, so the answer is 5.0. That is normal.',
        },
        {
          type: 'blank', title: 'Months of stock',
          text: 'Months of stock = stock divided by monthly use. Replace `___` with the right symbol. Expected output: `3.0`',
          code: 'stock = 120\nmonthly_use = 40\nmonths_left = stock ___ monthly_use\nprint(months_left)',
          check: { kind: 'exact', out: '3.0' },
          hints: ['Which symbol divides?', 'Use `/`'],
          solution: 'stock = 120\nmonthly_use = 40\nmonths_left = stock / monthly_use\nprint(months_left)',
          explain: 'This is months of stock, a number supply chain teams use every day. 120 / 40 = 3.0 months.',
        },
        {
          type: 'fix', title: 'Multiply the Python way',
          text: 'Run it, read the error, and fix it so it shows: `360`',
          code: 'packs = 120\ncartons = 3\ntotal = packs x cartons\nprint(total)',
          check: { kind: 'exact', out: '360' },
          hints: ['Python doesn\'t use x to multiply.', 'Use `*` (the star): `packs * cartons`'],
          solution: 'packs = 120\ncartons = 3\ntotal = packs * cartons\nprint(total)',
          explain: 'In Python, * means multiply. The x was read as a variable name, which made the line invalid.',
        },
        {
          type: 'quiz', title: 'Naming rules',
          text: 'Which one is a valid variable name?',
          options: ['monthly use', 'monthly_use', 'monthly-use'], answer: 1,
          explain: 'Names can\'t have spaces or dashes. Join words with an underscore. A dash would mean minus.',
        },
        {
          type: 'write', title: 'Your first calculation',
          text: 'A facility received 500 packs of ACT and issued 180. Create `received` and `issued`, work out the balance, and print it.',
          code: '# Inputs\n\n# Work out and print the balance\n',
          check: { kind: 'exact', out: '320', vars: { received: '500', issued: '180' } },
          hints: ['Start with `received = 500` and `issued = 180`.', 'Then `balance = received - issued` and `print(balance)`'],
          solution: '# Inputs\nreceived = 500\nissued = 180\n# Work out and print the balance\nbalance = received - issued\nprint(balance)',
          explain: 'Inputs, calculation, output. Most programs are built from those three parts.',
        },
        {
          type: 'write', title: 'Round it',
          text: '`round(value, 1)` keeps 1 decimal place, so round(2.857, 1) gives 2.9. Print the months of stock rounded to 1 decimal place. Expected: `2.9`',
          code: 'stock = 1000\nmonthly_use = 350\n',
          check: { kind: 'exact', out: '2.9', mustUse: [['round(']] },
          hints: ['Divide first: `stock / monthly_use`', '`print(round(stock / monthly_use, 1))`'],
          solution: 'stock = 1000\nmonthly_use = 350\nmonths_left = round(stock / monthly_use, 1)\nprint(months_left)',
          explain: 'You can put one calculation inside another. Python works from the inside out: divide first, then round.',
        },
      ],
    },
    {
      id: 'd4', day: 4, minutes: 12, title: 'Working with text',
      idea: 'Text in Python is called a string. You can join it, change its capitals and measure it.',
      bridge: 'Like the concat(), toUpper(), toLower() and length() expressions in Power Automate.',
      steps: [
        {
          type: 'run', title: 'Text has tools',
          text: 'Tap **Run** and compare each line of output with the code.',
          code: 'item = "zinc tablets"\nprint(item.upper())\nprint(item.title())\nprint(len(item))',
          check: { kind: 'ran' },
          explain: '.upper() and .title() are methods: actions that belong to a string. You write them after a dot. len() counts the characters, including the space.',
        },
        {
          type: 'quiz', title: 'Joining text',
          text: 'What will this show?',
          code: 'print("ORS" + "sachets")',
          options: ['ORS sachets', 'ORSsachets', 'An error'], answer: 1,
          explain: '+ joins text exactly as it is. It doesn\'t add a space, so you add one yourself.',
        },
        {
          type: 'blank', title: 'Add the space',
          text: 'Replace `___` so it shows: `Malaria RDT kits`',
          code: 'first = "Malaria"\nsecond = "RDT kits"\nprint(first + ___ + second)',
          check: { kind: 'exact', out: 'Malaria RDT kits' },
          hints: ['You need a space between the two words.', 'A space inside quotes: `" "`'],
          solution: 'first = "Malaria"\nsecond = "RDT kits"\nprint(first + " " + second)',
          explain: 'A space is text too, so it goes inside quotes.',
        },
        {
          type: 'fix', title: 'Method names are lowercase',
          text: 'Run it, read the error, and fix it so it shows: `RIVERSIDE PHC`',
          code: 'facility = "riverside phc"\nprint(facility.Upper())',
          check: { kind: 'exact', out: 'RIVERSIDE PHC' },
          hints: ['Look at the capital letter in the method name.', 'Use `.upper()`'],
          solution: 'facility = "riverside phc"\nprint(facility.upper())',
          explain: 'AttributeError means the value has no tool with that name. Again, Python suggested the right spelling.',
        },
        {
          type: 'quiz', title: 'Counting letters',
          text: 'What will this show?',
          code: 'name = "Amoxicillin"\nprint(len(name))',
          options: ['10', '11', '12'], answer: 1,
          explain: 'len() counts every character. Amoxicillin has 11 letters.',
        },
        {
          type: 'write', title: 'Tidy a name',
          text: 'The name was typed in lowercase. Print it in title case, so it shows: `Market Road Health Post`',
          code: 'facility = "market road health post"\n',
          check: { kind: 'exact', out: 'Market Road Health Post', mustUse: [['.title()']] },
          hints: ['Use the .title() method.', '`print(facility.title())`'],
          solution: 'facility = "market road health post"\nprint(facility.title())',
          explain: 'Cleaning messy text is one of the most common real jobs for Python.',
        },
        {
          type: 'write', title: 'Clean messy data',
          text: 'This value has extra spaces. Remove them and make it capitals, so it shows: `ORS SACHETS`\n.strip() removes spaces at both ends.',
          code: 'item = "   ors sachets   "\n',
          check: { kind: 'exact', out: 'ORS SACHETS' },
          hints: ['You can chain methods, one after another.', '`print(item.strip().upper())`'],
          solution: 'item = "   ors sachets   "\nprint(item.strip().upper())',
          explain: 'Chaining runs the methods left to right: strip first, then upper. It is like piping one action\'s output into the next.',
        },
      ],
    },
    {
      id: 'd5', day: 5, minutes: 12, title: 'Mixing text and numbers',
      idea: 'To put a number inside a message, turn it into text with str(), or use an f-string.',
      bridge: 'In Power Automate you drop dynamic content into a text box. An f-string does the same: `f"Stock is {stock}"` puts the value of stock into the text.',
      steps: [
        {
          type: 'error', title: 'Meet a TypeError',
          text: 'This code has a problem on purpose. Tap **Run** and read the error. Errors are normal. They tell you what to fix.',
          code: 'stock = 120\nprint("Stock: " + stock)',
          check: { kind: 'error', errorType: 'TypeError' },
          explain: 'Python can\'t join text and a number with +. Both sides must be text.',
        },
        {
          type: 'fix', title: 'Turn the number into text',
          text: 'Fix it by wrapping stock in str(), so it shows: `Stock: 120`',
          code: 'stock = 120\nprint("Stock: " + stock)',
          check: { kind: 'exact', out: 'Stock: 120' },
          hints: ['str(stock) turns 120 into the text "120".', '`print("Stock: " + str(stock))`'],
          solution: 'stock = 120\nprint("Stock: " + str(stock))',
          explain: 'str() converts a value to text. Now both sides of + are text, so they join.',
        },
        {
          type: 'run', title: 'The easier way: f-strings',
          text: 'Tap **Run**. Notice the letter f before the quotes, and the names inside { }.',
          code: 'facility = "Riverside PHC"\nstock = 120\nprint(f"{facility} has {stock} packs")',
          check: { kind: 'ran' },
          explain: 'The f makes it an f-string. Anything inside { } is replaced by its value. No str() needed.',
        },
        {
          type: 'blank', title: 'Fill the braces',
          text: 'Replace `___` so it shows: `ORS sachets: 340 left`',
          code: 'item = "ORS sachets"\nbalance = 340\nprint(f"{item}: {___} left")',
          check: { kind: 'exact', out: 'ORS sachets: 340 left' },
          hints: ['Put a variable name inside the braces.', '`{balance}`'],
          solution: 'item = "ORS sachets"\nbalance = 340\nprint(f"{item}: {balance} left")',
          explain: 'The braces are slots. Python fills each slot with the value of whatever is inside it.',
        },
        {
          type: 'quiz', title: 'Maths inside braces',
          text: 'What will this show?',
          code: 'print(f"{2 + 3} items")',
          options: ['{2 + 3} items', '5 items', '2 + 3 items'], answer: 1,
          explain: 'Python works out whatever is inside the braces first, then puts the answer into the text.',
        },
        {
          type: 'fix', title: 'The missing f',
          text: 'This shows the braces instead of the number. Fix it so it shows: `Stock left: 75`',
          code: 'stock = 75\nprint("Stock left: {stock}")',
          check: { kind: 'exact', out: 'Stock left: 75' },
          hints: ['An f-string needs the letter f right before the opening quote.', '`print(f"Stock left: {stock}")`'],
          solution: 'stock = 75\nprint(f"Stock left: {stock}")',
          explain: 'Without the f, braces are just characters. With it, they become slots for values.',
        },
        {
          type: 'write', title: 'Write an f-string',
          text: 'Use an f-string to print: `Hilltop Clinic has 2.5 months of stock`',
          code: 'facility = "Hilltop Clinic"\nmonths = 2.5\n',
          check: { kind: 'exact', out: 'Hilltop Clinic has 2.5 months of stock', mustUse: [['f"', "f'"]], mustUseMsg: 'Use an f-string: put f right before the opening quote.' },
          hints: ['Start with `print(f"` and use {facility} and {months}.', '`print(f"{facility} has {months} months of stock")`'],
          solution: 'facility = "Hilltop Clinic"\nmonths = 2.5\nprint(f"{facility} has {months} months of stock")',
          explain: 'f-strings are the everyday way to build messages in Python. You\'ll use them constantly.',
        },
      ],
    },
    {
      id: 'd6', day: 6, minutes: 12, title: 'Reading errors without fear',
      idea: 'Every error tells you three things: what kind of problem, which line, and a short message. Read those and errors become hints.',
      bridge: 'When a flow fails, the run history shows a red action and an error message. A Python error is the same idea: it points to the failing line and says why.',
      steps: [
        {
          type: 'error', title: 'Read an error',
          text: 'Tap **Run**. In the error, find the error type, the line number and the message.',
          code: 'stock = 120\nprint(stok)',
          check: { kind: 'error', errorType: 'NameError' },
          explain: 'NameError means Python doesn\'t know a name. It happened on line 2, and the message even suggests stock.',
        },
        {
          type: 'quiz', title: 'Decode the message',
          text: 'Python says: `SyntaxError: \'(\' was never closed`. What is the fix?',
          options: ['Add a closing bracket )', 'Add quotes', 'Delete the line'], answer: 0,
          explain: 'Brackets come in pairs. Every ( needs a ) to close it.',
        },
        {
          type: 'fix', title: 'Close the bracket',
          text: 'Fix it so it shows: `Report ready`',
          code: 'print("Report ready"',
          check: { kind: 'exact', out: 'Report ready' },
          hints: ['Count the ( and ) characters.', 'Add `)` at the end of the line.'],
          solution: 'print("Report ready")',
          explain: 'One opening bracket, one closing bracket. Checking pairs is a habit worth building.',
        },
        {
          type: 'fix', title: 'Spaces at the start',
          text: 'Run it and read the error. Fix it so it shows: `Zinc tablets`',
          code: 'item = "Zinc tablets"\n    print(item)',
          check: { kind: 'exact', out: 'Zinc tablets' },
          hints: ['Line 2 has spaces at the start.', 'Delete the spaces before print, so it starts at the left edge.'],
          solution: 'item = "Zinc tablets"\nprint(item)',
          explain: 'In Python, spaces at the start of a line mean "this belongs inside the block above". You\'ll use that next week with if and loops. For now, start lines at the left edge.',
        },
        {
          type: 'fix', title: 'Text plus a number',
          text: 'Fix it so it shows: `Issued: 45 packs`',
          code: 'issued = 45\nprint("Issued: " + issued + " packs")',
          check: { kind: 'exact', out: 'Issued: 45 packs' },
          hints: ['Joining text and a number with + causes a TypeError.', 'Use str(issued), or an f-string: `print(f"Issued: {issued} packs")`'],
          solution: 'issued = 45\nprint(f"Issued: {issued} packs")',
          explain: 'Two ways to fix the same problem. Either is right. Most people reach for the f-string.',
        },
        {
          type: 'fix', title: 'Two bugs, one at a time',
          text: 'This has two bugs. Fix the first error, run again, then fix the next. Goal: `Balance: 180`',
          code: 'received = 300\nused = 120\nbalance = received - Used\nprint(f"Balance: {balance}"',
          check: { kind: 'exact', out: 'Balance: 180' },
          hints: ['Python reports the bracket problem first. Close the bracket on line 4.', 'Then fix the capital letter on line 3: `used`'],
          solution: 'received = 300\nused = 120\nbalance = received - used\nprint(f"Balance: {balance}")',
          explain: 'Python stops at the first error it finds. Fix it, run again, fix the next. That is normal debugging.',
        },
        {
          type: 'quiz', title: 'Your first move',
          text: 'You get an error. What is the best first step?',
          options: ['Delete everything and start again', 'Read the error type and the line number', 'Give up for today'], answer: 1,
          explain: 'The error points you to the line and the problem. Read it first. If you\'re still stuck, use the hint or Ask Claude buttons.',
        },
      ],
    },
    {
      id: 'd7', day: 7, minutes: 15, title: 'Mini project: a stock card',
      idea: 'Put the week together. You\'ll build a small tool that works out the balance and months of stock for one item.',
      bridge: 'This is like a small flow: get the inputs, calculate, then compose a message. Same steps, written as code.',
      steps: [
        {
          type: 'write', title: 'Step 1: the inputs',
          text: 'Add these four variables below the facility line:\n`item = "Amoxicillin"`\n`received = 600`\n`issued = 280`\n`monthly_use = 80`\nThe last line prints the facility, to check the program runs.',
          code: '# Stock card inputs\nfacility = "Riverside PHC"\n\nprint(facility)',
          check: { kind: 'exact', out: 'Riverside PHC', vars: { item: "'Amoxicillin'", received: '600', issued: '280', monthly_use: '80' } },
          hints: ['Type each variable on its own line, between line 2 and the print line.', 'Text needs quotes ("Amoxicillin"). Numbers don\'t.'],
          solution: '# Stock card inputs\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\nprint(facility)',
          explain: 'Inputs first. Keeping them at the top makes the program easy to update later.',
        },
        {
          type: 'write', title: 'Step 2: the balance',
          text: 'Your inputs are filled in. Create `balance` as received minus issued, then print it.',
          code: '# Stock card inputs\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Balance\n',
          check: { kind: 'exact', out: '320', vars: { balance: '320' } },
          hints: ['`balance = received - issued`', 'Then `print(balance)`'],
          solution: '# Stock card inputs\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Balance\nbalance = received - issued\nprint(balance)',
          explain: 'One calculation, stored in a well-named variable.',
        },
        {
          type: 'write', title: 'Step 3: months of stock',
          text: 'Create `months_left`: balance divided by monthly_use, rounded to 1 decimal place. Print it. Expected: `4.0`',
          code: '# Stock card inputs\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Balance\nbalance = received - issued\n\n# Months of stock\n',
          check: { kind: 'exact', out: '4.0', vars: { months_left: '4.0' }, mustUse: [['round(']] },
          hints: ['`round(balance / monthly_use, 1)`', '`months_left = round(balance / monthly_use, 1)` then `print(months_left)`'],
          solution: '# Stock card inputs\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Balance\nbalance = received - issued\n\n# Months of stock\nmonths_left = round(balance / monthly_use, 1)\nprint(months_left)',
          explain: '320 / 80 = 4.0 months of stock.',
        },
        {
          type: 'write', title: 'Step 4: print the card',
          text: 'Use f-strings to print the stock card. Your output must match exactly:\n`Facility: Riverside PHC`\n`Item: Amoxicillin`\n`Balance: 320 packs`\n`Months of stock: 4.0`',
          code: '# Stock card inputs\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Calculations\nbalance = received - issued\nmonths_left = round(balance / monthly_use, 1)\n\n# Print the stock card\n',
          check: { kind: 'exact', out: 'Facility: Riverside PHC\nItem: Amoxicillin\nBalance: 320 packs\nMonths of stock: 4.0', mustUse: [['f"', "f'"]], mustUseMsg: 'Use f-strings for the stock card: f"Facility: {facility}"' },
          hints: ['Four print() lines, one per row of the card.', 'First row: `print(f"Facility: {facility}")`'],
          solution: '# Stock card inputs\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Calculations\nbalance = received - issued\nmonths_left = round(balance / monthly_use, 1)\n\n# Print the stock card\nprint(f"Facility: {facility}")\nprint(f"Item: {item}")\nprint(f"Balance: {balance} packs")\nprint(f"Months of stock: {months_left}")',
          explain: 'That is a complete program: inputs, calculations and a formatted report.',
        },
        {
          type: 'change', title: 'Step 5: new numbers',
          text: 'Real numbers change. Change issued from 280 to 490 and run it again. Watch the balance and months of stock update by themselves.',
          code: '# Stock card inputs\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Calculations\nbalance = received - issued\nmonths_left = round(balance / monthly_use, 1)\n\n# Print the stock card\nprint(f"Facility: {facility}")\nprint(f"Item: {item}")\nprint(f"Balance: {balance} packs")\nprint(f"Months of stock: {months_left}")',
          check: { kind: 'exact', out: 'Facility: Riverside PHC\nItem: Amoxicillin\nBalance: 110 packs\nMonths of stock: 1.4', vars: { issued: '490' } },
          hints: ['Change only line 5.', '`issued = 490`'],
          solution: '# Stock card inputs\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 490\nmonthly_use = 80\n\n# Calculations\nbalance = received - issued\nmonths_left = round(balance / monthly_use, 1)\n\n# Print the stock card\nprint(f"Facility: {facility}")\nprint(f"Item: {item}")\nprint(f"Balance: {balance} packs")\nprint(f"Months of stock: {months_left}")',
          explain: 'You changed one input and everything else updated. That is why we write programs instead of doing the sums by hand.',
        },
        {
          type: 'quiz', title: 'What should happen next?',
          text: 'Months of stock is now 1.4. If the facility needs at least 2 months, what should the program do?',
          options: ['Nothing', 'Flag it for resupply', 'Delete the record'], answer: 1,
          explain: 'Next week you\'ll teach Python to make that decision itself with if and else, like a Condition in Power Automate.',
        },
      ],
    },
  ];

  const normOut = (s) => String(s || '').replace(/[ \t]+$/gm, '').replace(/\n+$/, '');

  // Checks a code step. Returns {ok, reason, expected?, got?}.
  function check(step, code, res) {
    const c = step.check || { kind: 'ran' };
    if (!res) return { ok: false, reason: 'not-run' };
    if (c.kind === 'error') {
      if (res.error && res.error.type === c.errorType) return { ok: true };
      return { ok: false, reason: 'want-error', message: `Run the code as it is to see the ${c.errorType}.` };
    }
    if (res.error) return { ok: false, reason: 'error' };
    if (step.type === 'blank' && code.includes('___')) return { ok: false, reason: 'blank', message: 'Replace the ___ with your answer.' };
    const out = normOut(res.output);
    if (c.mustUse) {
      for (const alts of c.mustUse) {
        if (!alts.some((a) => code.includes(a))) return { ok: false, reason: 'must-use', message: c.mustUseMsg || `This step wants you to use ${alts[0]} in your code.` };
      }
    }
    if (c.vars) {
      for (const [name, want] of Object.entries(c.vars)) {
        const v = res.vars && res.vars[name];
        if (!v) return { ok: false, reason: 'var-missing', message: `Create a variable called ${name}.` };
        if (v.repr !== want) return { ok: false, reason: 'var-wrong', message: `Check ${name}: it should be ${want}, but it is ${v.repr}.` };
      }
    }
    switch (c.kind) {
      case 'ran':
        return { ok: true };
      case 'changed':
        if (!out) return { ok: false, reason: 'empty', message: 'Your code ran but showed nothing. Keep the print() line.' };
        if (out === normOut(c.from)) return { ok: false, reason: 'same', message: 'The output is the same as before. Change something, then run it again.' };
        return { ok: true };
      case 'exact': {
        const want = normOut(c.out);
        if (out === want) return { ok: true };
        let message = 'Not quite. Compare your output with the expected output.';
        if (out.toLowerCase() === want.toLowerCase()) message = 'So close. Only the capital letters are different.';
        else if (out.replace(/\s+/g, '') === want.replace(/\s+/g, '')) message = 'So close. Only the spaces or line breaks are different.';
        else if (!out) message = 'Your code ran but showed nothing. Did you print() the result?';
        return { ok: false, reason: 'output', message, expected: want, got: out };
      }
    }
    return { ok: true };
  }

  root.LESSONS = LESSONS;
  root.PSCheck = check;
})(typeof window !== 'undefined' ? window : globalThis);
