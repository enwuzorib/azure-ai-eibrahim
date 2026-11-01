/* Python Steps, Week 1: "The Stockwise Story".
   You join a small team building Stockwise, an AI assistant for a district health office.
   Each day is a chapter that teaches one Python skill through the work AI builders do:
   prompts, settings, tokens and cost, cleaning input, guardrails, templates and debugging.
   All people, places and numbers are made up. Every solution is checked against real
   Python by tests/test-lessons.mjs. */
(function (root) {
  'use strict';

  const LESSONS = [
    {
      id: 'd1', day: 1, minutes: 10, weekday: 'Monday', emblem: 'talk',
      title: 'Day one at the lab', skill: 'print()', ability: 'can talk',
      scene: [
        'It’s 8:40 on a Monday. The Riverside District health office smells of coffee and printer toner. Somewhere down the corridor, a phone rings and rings.',
        'Zara, the team’s lead engineer, waves you over to a desk where a laptop is already open. On the screen, a single blinking cursor.',
        '“Welcome to Stockwise,” she says. “We’re building an AI assistant that helps pharmacists spot stockouts before patients feel them. Every assistant starts the same way. Before it can think, it has to speak.”',
      ],
      quote: 'Copilot Studio hides the code. Here, you’ll see every line. That’s where the power is.',
      why: 'When you build with AI, print() is how you see what a model actually returned before you trust it. Builders print prompts and replies constantly while testing.',
      bridge: 'In a flow, you open the run history to see what a Compose action produced. In Python, print() does that job: it shows a value so you can see it.',
      outro: 'By lunchtime, Stockwise can talk. Zara closes the laptop. “Tomorrow,” she says, “we teach it to remember.”',
      steps: [
        {
          type: 'run', title: 'The first word',
          say: 'Zara types one line and slides the laptop across. “Tap Run. This is Stockwise saying its first words.”',
          text: 'Tap **Run**. Python reads the line and shows the text inside the quotes.',
          code: 'print("Hello, I am Stockwise.")',
          check: { kind: 'ran' },
          explain: 'print() showed the text between the quotes. The quotes tell Python: this is text, show it exactly as written.',
        },
        {
          type: 'change', title: 'Give it your voice',
          say: '“Every assistant needs a personality,” Zara says. “Write its greeting.”',
          text: 'Change the words inside the quotes to your own greeting, then tap **Run**. Keep both quote marks.',
          code: 'print("Hello, I am Stockwise.")',
          check: { kind: 'changed', from: 'Hello, I am Stockwise.' },
          hints: ['Only change the words between the two quote marks.', 'For example: `print("Good morning! How can I help with stock today?")`'],
          solution: 'print("Good morning! How can I help with stock today?")',
          explain: 'You changed the program and the output changed with it. Change, run, look: that loop is how all building works, with or without AI.',
        },
        {
          type: 'quiz', title: 'Zara’s quick test',
          say: 'Zara grins. “Quick test before coffee.”',
          text: 'What will this show?',
          code: 'print("2 + 3")',
          options: ['5', '2 + 3', 'An error'], answer: 1,
          explain: 'The quotes make it text, so Python shows it exactly as written. Without quotes, `print(2 + 3)` would do the maths and show 5.',
        },
        {
          type: 'fix', title: 'The overnight crash',
          say: 'A message from the pharmacy team: the assistant crashed overnight. Zara points at the screen. “Run it. Read what Python is telling you.”',
          text: 'Fix the line so it shows: `Checking stock levels...`',
          code: 'print("Checking stock levels...)',
          check: { kind: 'exact', out: 'Checking stock levels...' },
          hints: ['Text needs a quote at the start and at the end.', 'Add `"` just before the closing bracket `)`.'],
          solution: 'print("Checking stock levels...")',
          explain: 'Every piece of text needs an opening and a closing quote. “Unterminated string literal” means the text never ended.',
        },
        {
          type: 'fix', title: 'Capital letters matter',
          say: '“Second bug,” Zara says. “This one fools everybody once.”',
          text: 'Run it, read the error, then fix it so it shows: `Stockwise is online`',
          code: 'Print("Stockwise is online")',
          check: { kind: 'exact', out: 'Stockwise is online' },
          hints: ['Python sees Print and print as two different names.', 'Change the capital P to a small p.'],
          solution: 'print("Stockwise is online")',
          explain: 'Python is case-sensitive. Notice the error even suggested the fix: “Did you mean: \'print\'?”',
        },
        {
          type: 'write', title: 'A real conversation',
          say: '“Chat apps show who said what,” Zara explains. “Write the first exchange between a pharmacist and Stockwise.”',
          text: 'Write two print() lines so the output is exactly:\n`User: Is amoxicillin in stock?`\n`Stockwise: Let me check.`\nLines that start with # are notes for people. Python skips them.',
          code: '# Write the two lines of the conversation\n',
          check: { kind: 'exact', out: 'User: Is amoxicillin in stock?\nStockwise: Let me check.' },
          hints: ['Each line of output needs its own print().', 'First line: `print("User: Is amoxicillin in stock?")`'],
          solution: '# Write the two lines of the conversation\nprint("User: Is amoxicillin in stock?")\nprint("Stockwise: Let me check.")',
          explain: 'Each print() starts a new line, and Python runs from top to bottom, like the actions in a flow.',
        },
        {
          type: 'quiz', title: 'Why builders print',
          say: '“Last question,” Zara says, “and it’s the most important one for AI work.”',
          text: 'An AI model has just replied. What should a builder do first?',
          options: ['Send it straight to the user', 'Print it and read it', 'Delete it and ask again'], answer: 1,
          explain: 'Models can be wrong or strange. Builders always look at what the model actually returned before trusting it, and print() is how you look.',
        },
      ],
    },
    {
      id: 'd2', day: 2, minutes: 12, weekday: 'Tuesday', emblem: 'boxes',
      title: 'The assistant’s memory', skill: 'Variables', ability: 'can remember',
      scene: [
        'Tuesday. Rain drums on the office roof. Zara is at the whiteboard, drawing three boxes in blue marker.',
        'She labels them: assistant name. Instructions. Question.',
        '“An AI app is mostly a set of named boxes,” she says, tapping each one. “The model’s name, its instructions, whatever the user just asked. Python calls these boxes variables. Learn them and you can read almost any AI code.”',
      ],
      quote: 'A variable is a label on a box. Change what’s in the box, and everything that uses it changes too.',
      why: 'Every AI app keeps its pieces in variables: the model name, the system prompt, the user’s question, the settings like temperature. Read them well and AI code stops looking scary.',
      bridge: 'This is Initialize variable in Power Automate, and the variables you set in a Copilot Studio topic. `question = "..."` creates a variable called question and puts text in it.',
      outro: '“Now it remembers,” Zara says, wiping the whiteboard clean. “Tomorrow we talk about the thing every AI project runs out of. Money.”',
      steps: [
        {
          type: 'run', title: 'Two named boxes',
          say: 'Zara writes the first two boxes in code. “Run it and watch what comes out.”',
          text: 'Tap **Run**. Notice there are no quotes around the names inside print(). We want what’s in the box, not the label.',
          code: 'assistant_name = "Stockwise"\nuser_question = "How many ORS sachets are left?"\nprint(assistant_name)\nprint(user_question)',
          check: { kind: 'ran' },
          explain: 'assistant_name and user_question are variables. print(user_question) shows the text stored in it. Text values need quotes. The names don’t.',
        },
        {
          type: 'change', title: 'Ask your own question',
          say: '“Users ask all sorts of things,” Zara says. “Change the question.”',
          text: 'Change the text in user_question to any question a pharmacist might ask, then tap **Run**.',
          code: 'assistant_name = "Stockwise"\nuser_question = "How many ORS sachets are left?"\nprint(assistant_name)\nprint(user_question)',
          check: { kind: 'changed', from: 'Stockwise\nHow many ORS sachets are left?' },
          hints: ['Only change the text inside the quotes on line 2.', 'For example: `user_question = "When is the next zinc delivery?"`'],
          solution: 'assistant_name = "Stockwise"\nuser_question = "When is the next zinc delivery?"\nprint(assistant_name)\nprint(user_question)',
          explain: 'The variable now holds your question, and print() shows the new value. In a real app, this is where the user’s message lands.',
        },
        {
          type: 'quiz', title: 'Which question wins?',
          say: '“Users change their minds,” Zara says. “So do variables.”',
          text: 'What will this show?',
          code: 'question = "Is zinc in stock?"\nquestion = "Is ACT in stock?"\nprint(question)',
          options: ['Is zinc in stock?', 'Is ACT in stock?', 'Both questions'], answer: 1,
          explain: 'The second line replaces the value, like Set variable in a flow. A variable holds one value at a time.',
        },
        {
          type: 'blank', title: 'The system prompt',
          say: '“Every AI assistant gets standing instructions,” Zara says. “We call them the system prompt. In Copilot Studio, they’re your agent’s instructions.”',
          text: 'Replace `___` so the program shows: `You are a helpful stock assistant.`',
          code: 'system_prompt = ___\nprint(system_prompt)',
          check: { kind: 'exact', out: 'You are a helpful stock assistant.' },
          hints: ['It’s text, so it needs quotes.', '`system_prompt = "You are a helpful stock assistant."`'],
          solution: 'system_prompt = "You are a helpful stock assistant."\nprint(system_prompt)',
          explain: 'You just wrote your first system prompt and stored it in a variable. Real AI apps start exactly like this.',
        },
        {
          type: 'fix', title: 'Same name, every time',
          say: 'The test run fails. Zara raises an eyebrow. “Read the error. It’s practically giving you the answer.”',
          text: 'Fix it so it shows: `assistant-small`',
          code: 'model_name = "assistant-small"\nprint(Model_name)',
          check: { kind: 'exact', out: 'assistant-small' },
          hints: ['Compare the name on line 1 with the name on line 2.', 'Make both names exactly the same: `model_name`'],
          solution: 'model_name = "assistant-small"\nprint(model_name)',
          explain: 'Python treats model_name and Model_name as different names. The error suggested the right one.',
        },
        {
          type: 'fix', title: 'Label or contents?',
          say: '“This one runs,” Zara says, “but it’s still wrong. Can you see why?”',
          text: 'This shows the word facility instead of its value. Fix it so it shows: `Riverside PHC`',
          code: 'facility = "Riverside PHC"\nprint("facility")',
          check: { kind: 'exact', out: 'Riverside PHC' },
          hints: ['Quotes around a name turn it into plain text.', 'Remove the quotes: `print(facility)`'],
          solution: 'facility = "Riverside PHC"\nprint(facility)',
          explain: 'print("facility") shows the label. print(facility) shows what’s in the box.',
        },
        {
          type: 'write', title: 'Set the temperature',
          say: '“One more setting,” Zara says. “Temperature controls how creative a model is. For stock numbers, we want it calm and predictable.”',
          text: 'Create a variable called `temperature` that holds the number `0.2`, then print it. Numbers don’t need quotes.',
          code: '# Create the setting, then print it\n',
          check: { kind: 'exact', out: '0.2', vars: { temperature: '0.2' } },
          hints: ['Two lines: one creates the variable, one prints it.', '`temperature = 0.2` then `print(temperature)`'],
          solution: '# Create the setting, then print it\ntemperature = 0.2\nprint(temperature)',
          explain: 'Low temperature means steadier answers. You’ll see settings like this in every AI tool, including Copilot Studio.',
        },
      ],
    },
    {
      id: 'd3', day: 3, minutes: 12, weekday: 'Wednesday', emblem: 'gauge',
      title: 'The token budget', skill: 'Numbers and maths', ability: 'knows its budget',
      scene: [
        'Wednesday begins with a spreadsheet and a frown. Finance wants to know what Stockwise will cost before anyone signs off on the launch.',
        '“Models don’t read words the way we do,” Zara explains, pulling up a chair. “They read small pieces called tokens. We pay for every token, and each model can only hold so many at once. That limit is the context window.”',
        'She pushes the laptop towards you. “So before we spend a single naira, we do the maths.”',
      ],
      quote: 'Every AI project is two problems: making it smart, and making it affordable.',
      why: 'Models are limited and billed by tokens. A common rule of thumb for English is that one token is about three quarters of a word. Builders estimate tokens and cost with simple maths like this before every launch.',
      bridge: 'Like the add(), sub(), mul() and div() expressions in Power Automate, but written with symbols: + - * /',
      outro: 'Finance signs off before lunch. “Good work,” Zara says. “Now for the hard part. Real messages from real people are messy.”',
      steps: [
        {
          type: 'run', title: 'Room left in the window',
          say: '“Our model can read 8,000 tokens at once,” Zara says. “The instructions already use 1,200. How much room is left for the conversation?”',
          text: 'Tap **Run**. Python does the subtraction and stores the answer.',
          code: 'context_limit = 8000\nprompt_tokens = 1200\ntokens_left = context_limit - prompt_tokens\nprint(tokens_left)',
          check: { kind: 'ran' },
          explain: 'Python worked out context_limit - prompt_tokens and stored the answer in tokens_left. No quotes, because these are numbers. Notice that you write 8000 without the comma.',
        },
        {
          type: 'quiz', title: 'Dividing',
          say: 'Zara scribbles on a sticky note. “Before we go on, one thing that surprises everyone.”',
          text: 'What will this show?',
          code: 'print(10 / 2)',
          options: ['5', '5.0', '10 / 2'], answer: 1,
          explain: 'Division with / always gives a decimal number in Python, so the answer is 5.0. That’s normal.',
        },
        {
          type: 'blank', title: 'Words into tokens',
          say: '“A pharmacist’s message is about 300 words,” Zara says. “If one token is three quarters of a word, how many tokens is that?”',
          text: 'Tokens are roughly words divided by 0.75. Replace `___` with the right symbol. Expected output: `400.0`',
          code: 'words = 300\ntokens = words ___ 0.75\nprint(tokens)',
          check: { kind: 'exact', out: '400.0' },
          hints: ['Which symbol divides?', 'Use `/`'],
          solution: 'words = 300\ntokens = words / 0.75\nprint(tokens)',
          explain: '300 words is about 400 tokens. Estimates like this tell you whether a message fits the context window.',
        },
        {
          type: 'fix', title: 'Daily usage',
          say: '“Each question uses about 500 tokens, and we expect 40 questions a day,” Zara says. “Someone wrote the maths. It doesn’t run.”',
          text: 'Run it, read the error, and fix it so it shows: `20000`',
          code: 'tokens_per_question = 500\nquestions_per_day = 40\ndaily_tokens = tokens_per_question x questions_per_day\nprint(daily_tokens)',
          check: { kind: 'exact', out: '20000' },
          hints: ['Python doesn’t use x to multiply.', 'Use `*` (the star): `tokens_per_question * questions_per_day`'],
          solution: 'tokens_per_question = 500\nquestions_per_day = 40\ndaily_tokens = tokens_per_question * questions_per_day\nprint(daily_tokens)',
          explain: 'In Python, * means multiply. The x was read as a name, which made the line invalid.',
        },
        {
          type: 'quiz', title: 'Naming rules',
          say: '“Quick one,” Zara says. “Which of these would Python accept?”',
          text: 'Which one is a valid variable name?',
          options: ['max tokens', 'max_tokens', 'max-tokens'], answer: 1,
          explain: 'Names can’t have spaces or dashes. Join words with an underscore. A dash would mean minus. You’ll see max_tokens in real AI code all the time.',
        },
        {
          type: 'write', title: 'What it costs',
          say: 'Finance leans over your shoulder. “So what’s the daily bill?”',
          text: 'Our practice model costs $0.25 per 1,000 tokens (a made-up price). Create `daily_tokens = 20000` and `price_per_1k = 0.25`, then print the daily cost: daily_tokens / 1000 * price_per_1k. Expected: `5.0`',
          code: '# Usage and price\n\n# Work out and print the daily cost\n',
          check: { kind: 'exact', out: '5.0', vars: { daily_tokens: '20000', price_per_1k: '0.25' } },
          hints: ['Start with `daily_tokens = 20000` and `price_per_1k = 0.25`.', 'Then `print(daily_tokens / 1000 * price_per_1k)`'],
          solution: '# Usage and price\ndaily_tokens = 20000\nprice_per_1k = 0.25\n# Work out and print the daily cost\nprint(daily_tokens / 1000 * price_per_1k)',
          explain: 'Five dollars a day. Python does * and / from left to right, like a calculator. Finance is happy.',
        },
        {
          type: 'write', title: 'Average per question',
          say: '“Yesterday’s pilot used 20,000 tokens across 37 questions,” Zara says. “What’s the average? Nobody needs twelve decimal places.”',
          text: '`round(value, 1)` keeps 1 decimal place. Print the average tokens per question, rounded to 1 decimal place. Expected: `540.5`',
          code: 'total_tokens = 20000\nquestions = 37\n',
          check: { kind: 'exact', out: '540.5', mustUse: [['round(']] },
          hints: ['Divide first: `total_tokens / questions`', '`print(round(total_tokens / questions, 1))`'],
          solution: 'total_tokens = 20000\nquestions = 37\naverage = round(total_tokens / questions, 1)\nprint(average)',
          explain: 'Python works from the inside out: divide first, then round. You’ll write lines like this whenever you report on AI usage.',
        },
      ],
    },
    {
      id: 'd4', day: 4, minutes: 12, weekday: 'Thursday', emblem: 'sparkle',
      title: 'Messy messages', skill: 'Working with text', ability: 'cleans messages',
      scene: [
        'Thursday. Zara opens a log of questions pharmacists typed into the pilot, and you both laugh.',
        'Some are in shouting capitals. Some have spaces before and after. One just says “   AMOXICILLIN??   ”. Another asks Stockwise for the admin password.',
        '“Models cope better with clean input,” Zara says, “and some words should never reach the model at all. Today, you’re the filter.”',
      ],
      quote: 'Garbage in, garbage out. Clean text in, useful answers out.',
      why: 'Before text goes to a model, builders clean it: strip spaces, fix the case, check the length, and look for words that need special handling. These checks are called guardrails.',
      bridge: 'Like the trim(), toUpper(), toLower(), length() and contains() expressions in Power Automate.',
      outro: '“Clean in, clean out,” Zara says, closing the log. “Tomorrow you write the most important text in any AI app. The prompt.”',
      steps: [
        {
          type: 'run', title: 'Text has tools',
          say: 'Zara copies one messy message into the code. “Watch what these tools do to it.”',
          text: 'Tap **Run** and compare each line of output with the code.',
          code: 'message = "  how many ACT packs are left?  "\nprint(message.strip())\nprint(message.strip().upper())\nprint(len(message))',
          check: { kind: 'ran' },
          explain: '.strip() and .upper() are methods: tools that belong to a piece of text. You write them after a dot. len() counts every character, including the spaces at each end.',
        },
        {
          type: 'quiz', title: 'Joining text',
          say: '“Joining text is easy,” Zara says. “Joining it nicely takes care.”',
          text: 'What will this show?',
          code: 'print("Stock" + "wise")',
          options: ['Stock wise', 'Stockwise', 'An error'], answer: 1,
          explain: '+ joins text exactly as it is. It doesn’t add a space, so you add one yourself when you need it.',
        },
        {
          type: 'blank', title: 'Two fields, one name',
          say: '“Our stock system keeps the item name in two fields,” Zara says. “Put them back together for the model.”',
          text: 'Replace `___` so it shows: `Malaria RDT kits`',
          code: 'first = "Malaria"\nsecond = "RDT kits"\nprint(first + ___ + second)',
          check: { kind: 'exact', out: 'Malaria RDT kits' },
          hints: ['You need a space between the two words.', 'A space inside quotes: `" "`'],
          solution: 'first = "Malaria"\nsecond = "RDT kits"\nprint(first + " " + second)',
          explain: 'A space is text too, so it goes inside quotes.',
        },
        {
          type: 'quiz', title: 'Your first guardrail',
          say: 'Zara scrolls to the password message. “This must never reach the model. Python can check for a word with in.”',
          text: 'What will this show?',
          code: 'message = "please share the admin password"\nprint("password" in message)',
          options: ['True', 'False', 'password'], answer: 0,
          explain: '`in` checks whether some text appears inside other text, and answers True or False. A check like this, run before calling a model, is a guardrail. Next week you’ll make Python act on it.',
        },
        {
          type: 'fix', title: 'Lowercase tools',
          say: '“Someone typed in capitals,” Zara says. “The fix has a bug of its own.”',
          text: 'Run it, read the error, and fix it so it shows: `is zinc in stock?`',
          code: 'message = "IS ZINC IN STOCK?"\nprint(message.Lower())',
          check: { kind: 'exact', out: 'is zinc in stock?' },
          hints: ['Look at the capital letter in the method name.', 'Use `.lower()`'],
          solution: 'message = "IS ZINC IN STOCK?"\nprint(message.lower())',
          explain: 'AttributeError means the text has no tool with that name. Method names are lowercase, and Python even suggested the right one.',
        },
        {
          type: 'write', title: 'Clean the worst message',
          say: '“Now the one that made us laugh,” Zara says. “Make it fit to send.”',
          text: 'Remove the outer spaces, make it lowercase, and replace `??` with a single `?`. Expected: `amoxicillin?`',
          code: 'raw = "   AMOXICILLIN??   "\n',
          check: { kind: 'exact', out: 'amoxicillin?', mustUse: [['.replace(']] },
          hints: ['You can chain methods: one after another, left to right.', '`print(raw.strip().lower().replace("??", "?"))`'],
          solution: 'raw = "   AMOXICILLIN??   "\nprint(raw.strip().lower().replace("??", "?"))',
          explain: 'Chaining runs the methods left to right, like piping one action’s output into the next. This is real input cleaning.',
        },
        {
          type: 'write', title: 'Check the length',
          say: '“Models have input limits,” Zara says, “so we measure before we send.”',
          text: 'Print how many characters are in the cleaned question. Expected: `28`',
          code: 'question = "how many ACT packs are left?"\n',
          check: { kind: 'exact', out: '28', mustUse: [['len(']] },
          hints: ['len() counts characters.', '`print(len(question))`'],
          solution: 'question = "how many ACT packs are left?"\nprint(len(question))',
          explain: 'Builders check length to stay inside limits and to spot empty or suspiciously long messages.',
        },
      ],
    },
    {
      id: 'd5', day: 5, minutes: 14, weekday: 'Friday', emblem: 'prompt',
      title: 'Writing the prompt', skill: 'f-strings and prompts', ability: 'writes prompts',
      scene: [
        'Friday. A yellow sticky note is waiting on your screen in Zara’s handwriting: “A prompt is just text with blanks.”',
        '“In Copilot Studio, the platform fills the blanks for you,” she says when she arrives. “In Python, you fill them yourself. It’s more work. But you control every single word the model sees.”',
        'She sits back. “Today you write the prompt Stockwise will send on launch day.”',
      ],
      quote: 'The model only knows what you put in the prompt. Nothing more.',
      why: 'A prompt template is an f-string. Builders keep the fixed instructions in the text and drop the changing facts (facility, item, numbers) into the blanks. This is the heart of every AI app.',
      bridge: 'In Copilot Studio and Power Automate you drop dynamic content into a text box. An f-string does the same: `f"Stock is {stock}"` puts the value of stock into the text.',
      outro: 'Zara reads your prompt twice, then nods slowly. “That’s what we send on Monday.” She pauses at the door. “Keep your phone on this weekend. Just in case.”',
      steps: [
        {
          type: 'error', title: 'Text plus a number',
          say: '“First, the mistake everyone makes building prompts,” Zara says. “Run it. Don’t panic.”',
          text: 'This code has a problem on purpose. Tap **Run** and read the error.',
          code: 'stock = 120\nprint("Stock on hand: " + stock)',
          check: { kind: 'error', errorType: 'TypeError' },
          explain: 'Python can’t join text and a number with +. Both sides must be text.',
        },
        {
          type: 'fix', title: 'Turn the number into text',
          say: '“One way out,” Zara says. “Turn the number into text with str().”',
          text: 'Wrap stock in str() so it shows: `Stock on hand: 120`',
          code: 'stock = 120\nprint("Stock on hand: " + stock)',
          check: { kind: 'exact', out: 'Stock on hand: 120' },
          hints: ['str(stock) turns 120 into the text "120".', '`print("Stock on hand: " + str(stock))`'],
          solution: 'stock = 120\nprint("Stock on hand: " + str(stock))',
          explain: 'str() converts a value to text. Now both sides of + are text, so they join.',
        },
        {
          type: 'run', title: 'Your first prompt template',
          say: '“Now the better way,” Zara says. “Watch the letter f.”',
          text: 'Tap **Run**. The f before the quotes makes it an f-string, and each name in { } is filled in.',
          code: 'facility = "Riverside PHC"\nitem = "ORS sachets"\nprompt = f"You are a stock assistant for {facility}. How many {item} should we order?"\nprint(prompt)',
          check: { kind: 'ran' },
          explain: 'That printed text is a real prompt, ready for a model. Change facility or item and the prompt changes with them. No str() needed.',
        },
        {
          type: 'blank', title: 'Fill the blank',
          say: '“The user’s question goes into the prompt,” Zara says. “Put it in the right slot.”',
          text: 'Replace `___` so it shows: `Answer briefly: Is zinc in stock?`',
          code: 'question = "Is zinc in stock?"\nprompt = f"Answer briefly: {___}"\nprint(prompt)',
          check: { kind: 'exact', out: 'Answer briefly: Is zinc in stock?' },
          hints: ['Put a variable name inside the braces.', '`{question}`'],
          solution: 'question = "Is zinc in stock?"\nprompt = f"Answer briefly: {question}"\nprint(prompt)',
          explain: 'The braces are slots. Python fills each slot with the value of whatever is inside it.',
        },
        {
          type: 'quiz', title: 'Maths inside the braces',
          say: 'Zara taps the screen. “Braces can hold more than names.”',
          text: 'What will this show?',
          code: 'print(f"{2 + 3} items")',
          options: ['{2 + 3} items', '5 items', '2 + 3 items'], answer: 1,
          explain: 'Python works out whatever is inside the braces first, then puts the answer into the text.',
        },
        {
          type: 'fix', title: 'The missing f',
          say: '“A teammate’s prompt keeps sending the braces to the model,” Zara says. “Spot the problem.”',
          text: 'Fix it so it shows: `Check stock for ACT packs`',
          code: 'item = "ACT packs"\nprint("Check stock for {item}")',
          check: { kind: 'exact', out: 'Check stock for ACT packs' },
          hints: ['An f-string needs the letter f right before the opening quote.', '`print(f"Check stock for {item}")`'],
          solution: 'item = "ACT packs"\nprint(f"Check stock for {item}")',
          explain: 'Without the f, braces are just characters, and the model would see {item} literally. With the f, they become slots.',
        },
        {
          type: 'run', title: 'A prompt on several lines',
          say: '“Real prompts are longer,” Zara says. “Three quotes let a prompt run over several lines.”',
          text: 'Tap **Run**. Notice `f"""` at the start and `"""` at the end.',
          code: 'facility = "Hilltop Clinic"\nmonths = 1.4\nprompt = f"""You are Stockwise.\nFacility: {facility}\nMonths of stock: {months}\nWrite a one-line resupply alert."""\nprint(prompt)',
          check: { kind: 'ran' },
          explain: 'Triple quotes keep the line breaks exactly as you typed them. This is how most real prompts are written in Python.',
        },
        {
          type: 'write', title: 'Write the summary prompt',
          say: '“Your turn,” Zara says. “Build the summary prompt and keep it in a variable called prompt.”',
          text: 'Create `prompt` with an f-string, then print it. Expected: `Summarise stock for Market Road Health Post in 2 sentences.`',
          code: 'facility = "Market Road Health Post"\nsentences = 2\n',
          check: { kind: 'exact', out: 'Summarise stock for Market Road Health Post in 2 sentences.', vars: { prompt: "'Summarise stock for Market Road Health Post in 2 sentences.'" }, mustUse: [['f"', "f'"]], mustUseMsg: 'Build it with an f-string: put f right before the opening quote.' },
          hints: ['Use both variables inside braces: {facility} and {sentences}.', '`prompt = f"Summarise stock for {facility} in {sentences} sentences."` then `print(prompt)`'],
          solution: 'facility = "Market Road Health Post"\nsentences = 2\nprompt = f"Summarise stock for {facility} in {sentences} sentences."\nprint(prompt)',
          explain: 'You built a reusable prompt template. Change the facility and the same code writes a new prompt. That’s prompt engineering in code.',
        },
      ],
    },
    {
      id: 'd6', day: 6, minutes: 12, weekday: 'Sunday night', emblem: 'moon',
      title: 'The night the bot broke', skill: 'Reading errors', ability: 'survives errors',
      scene: [
        'Sunday, 9:12 pm. Your phone buzzes on the kitchen table. Then again. And again.',
        '“Stockwise is down,” the message reads. “Pharmacists can’t get answers.”',
        'You open the code. Red text fills the screen. Then Zara joins the call, calm as ever, the sound of a kettle behind her. “Errors aren’t the enemy,” she says. “They’re a map. Read it with me.”',
      ],
      quote: 'Python always tells you three things: what went wrong, where, and usually a hint. Read before you panic.',
      why: 'Most AI apps fail in ordinary Python ways: a misspelled variable in a prompt template, a number joined to text, a missing bracket. Reading the error is the fastest fix there is.',
      bridge: 'When a flow fails, the run history shows a red action and an error message. A Python error is the same idea: it points to the failing line and says why.',
      outro: 'At 10:03 pm, Stockwise answers its first question of the night. Zara sends one message: “Nice debugging. Tomorrow, we launch.”',
      steps: [
        {
          type: 'error', title: 'Read the map',
          say: '“Run it,” Zara says. “Find three things: the error type, the line number, and the message.”',
          text: 'Tap **Run** and read the error carefully.',
          code: 'prompt_tokens = 1200\nprint(promt_tokens)',
          check: { kind: 'error', errorType: 'NameError' },
          explain: 'NameError means Python doesn’t know a name. It happened on line 2, and the message even suggests prompt_tokens. One missing letter took down the bot.',
        },
        {
          type: 'quiz', title: 'Decode the message',
          say: '“Next error in the log,” Zara says.',
          text: 'Python says: `SyntaxError: \'(\' was never closed`. What’s the fix?',
          options: ['Add a closing bracket )', 'Add quotes', 'Delete the line'], answer: 0,
          explain: 'Brackets come in pairs. Every ( needs a ) to close it.',
        },
        {
          type: 'fix', title: 'Close the bracket',
          say: '“Here it is in the code,” Zara says. “Get Stockwise back online.”',
          text: 'Fix it so it shows: `Stockwise is back online`',
          code: 'print("Stockwise is back online"',
          check: { kind: 'exact', out: 'Stockwise is back online' },
          hints: ['Count the ( and ) characters.', 'Add `)` at the end of the line.'],
          solution: 'print("Stockwise is back online")',
          explain: 'One opening bracket, one closing bracket. Checking pairs is a habit worth building.',
        },
        {
          type: 'fix', title: 'Spaces at the start',
          say: '“Someone pasted this from a chat,” Zara sighs. “Look at the start of line 2.”',
          text: 'Run it, read the error, and fix it so it shows: `ORS stock is low.`',
          code: 'reply = "ORS stock is low."\n    print(reply)',
          check: { kind: 'exact', out: 'ORS stock is low.' },
          hints: ['Line 2 has spaces at the start.', 'Delete the spaces before print, so it starts at the left edge.'],
          solution: 'reply = "ORS stock is low."\nprint(reply)',
          explain: 'In Python, spaces at the start of a line mean “this belongs inside the block above”. You’ll use that next week. For now, start lines at the left edge.',
        },
        {
          type: 'fix', title: 'The usage report',
          say: '“The usage report crashed too,” Zara says. “You’ve seen this one before.”',
          text: 'Fix it so it shows: `Used 450 tokens`',
          code: 'tokens = 450\nprint("Used " + tokens + " tokens")',
          check: { kind: 'exact', out: 'Used 450 tokens' },
          hints: ['Joining text and a number with + causes a TypeError.', 'Use str(tokens), or an f-string: `print(f"Used {tokens} tokens")`'],
          solution: 'tokens = 450\nprint(f"Used {tokens} tokens")',
          explain: 'Two ways to fix the same problem. Either is right. Most builders reach for the f-string.',
        },
        {
          type: 'fix', title: 'Two bugs, one at a time',
          say: '“Last one,” Zara says. “It has two bugs. Fix the first error, run again, then fix the next.”',
          text: 'Goal: `Tokens left: 6800`',
          code: 'limit = 8000\nused = 1200\nremaining = limit - Used\nprint(f"Tokens left: {remaining}"',
          check: { kind: 'exact', out: 'Tokens left: 6800' },
          hints: ['Python reports the bracket problem first. Close the bracket on line 4.', 'Then fix the capital letter on line 3: `used`'],
          solution: 'limit = 8000\nused = 1200\nremaining = limit - used\nprint(f"Tokens left: {remaining}")',
          explain: 'Python stops at the first error it finds. Fix it, run again, fix the next. That’s what real debugging looks like.',
        },
        {
          type: 'quiz', title: 'Your first move',
          say: 'Zara stretches. “What’s the lesson of tonight?”',
          text: 'You get an error. What’s the best first step?',
          options: ['Delete everything and start again', 'Read the error type and the line number', 'Ask the model to fix it without reading'], answer: 1,
          explain: 'The error points you to the line and the problem. Read it first. If you’re still stuck, tap Hint or Ask Zara.',
        },
      ],
    },
    {
      id: 'd7', day: 7, minutes: 15, weekday: 'Launch day', emblem: 'rocket',
      title: 'Launch day', skill: 'Putting it together', ability: 'is live',
      scene: [
        'Monday again, but nothing feels the same. The pilot pharmacist at Riverside PHC is waiting by the phone.',
        '“Here’s the plan,” Zara says. “Stockwise gets the numbers. Python does the maths. Then Python writes the exact prompt the AI model will read. No guessing. No made-up numbers.”',
        'She hands you the keyboard. “It’s your launch.”',
      ],
      quote: 'Let Python do the maths. Let the model do the words.',
      why: 'This is the real pattern behind most AI apps: inputs, calculations in code, then a prompt built from the results. Doing the maths in Python keeps the numbers right. The model only writes the message.',
      bridge: 'This is a small flow: get the inputs, calculate, compose a message, then send it to an AI step. Same shape, written as code.',
      outro: 'At 11:20 am, Stockwise sends its first real alert. The pharmacist replies with a thumbs up. Zara is already at the whiteboard: “Next week, it learns to make decisions.”',
      steps: [
        {
          type: 'write', title: 'Step 1: the inputs',
          say: '“Start with the facts from the stock system,” Zara says.',
          text: 'Add these four variables below the facility line:\n`item = "Amoxicillin"`\n`received = 600`\n`issued = 280`\n`monthly_use = 80`\nThe last line prints the facility, to check the program runs.',
          code: '# Inputs from the stock system\nfacility = "Riverside PHC"\n\nprint(facility)',
          check: { kind: 'exact', out: 'Riverside PHC', vars: { item: "'Amoxicillin'", received: '600', issued: '280', monthly_use: '80' } },
          hints: ['Type each variable on its own line, between line 2 and the print line.', 'Text needs quotes ("Amoxicillin"). Numbers don’t.'],
          solution: '# Inputs from the stock system\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\nprint(facility)',
          explain: 'Inputs first. Keeping them at the top makes the program easy to update.',
        },
        {
          type: 'write', title: 'Step 2: the balance',
          say: '“Now the maths the model should never guess,” Zara says.',
          text: 'Your inputs are filled in. Create `balance` as received minus issued, then print it.',
          code: '# Inputs from the stock system\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Balance\n',
          check: { kind: 'exact', out: '320', vars: { balance: '320' } },
          hints: ['`balance = received - issued`', 'Then `print(balance)`'],
          solution: '# Inputs from the stock system\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Balance\nbalance = received - issued\nprint(balance)',
          explain: 'One calculation, stored in a well-named variable.',
        },
        {
          type: 'write', title: 'Step 3: months of stock',
          say: '“Pharmacists think in months of stock,” Zara says. “Give them that.”',
          text: 'Create `months_left`: balance divided by monthly_use, rounded to 1 decimal place. Print it. Expected: `4.0`',
          code: '# Inputs from the stock system\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Balance\nbalance = received - issued\n\n# Months of stock\n',
          check: { kind: 'exact', out: '4.0', vars: { months_left: '4.0' }, mustUse: [['round(']] },
          hints: ['`round(balance / monthly_use, 1)`', '`months_left = round(balance / monthly_use, 1)` then `print(months_left)`'],
          solution: '# Inputs from the stock system\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Balance\nbalance = received - issued\n\n# Months of stock\nmonths_left = round(balance / monthly_use, 1)\nprint(months_left)',
          explain: '320 / 80 = 4.0 months of stock. Computed by Python, so it’s exactly right.',
        },
        {
          type: 'write', title: 'Step 4: write the prompt',
          say: '“The prompt has a beginning and an end,” Zara says. “Fill in the facts in the middle.”',
          text: 'Add three lines inside the prompt, after the Facility line, so the output is exactly:\n`You are Stockwise, a stock assistant.`\n`Facility: Riverside PHC`\n`Item: Amoxicillin`\n`Balance: 320 packs`\n`Months of stock: 4.0`\n`Write a one-sentence status update for the pharmacist.`',
          code: '# Inputs from the stock system\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Calculations\nbalance = received - issued\nmonths_left = round(balance / monthly_use, 1)\n\n# The prompt the AI model will read\nprompt = f"""You are Stockwise, a stock assistant.\nFacility: {facility}\nWrite a one-sentence status update for the pharmacist."""\nprint(prompt)',
          check: { kind: 'exact', out: 'You are Stockwise, a stock assistant.\nFacility: Riverside PHC\nItem: Amoxicillin\nBalance: 320 packs\nMonths of stock: 4.0\nWrite a one-sentence status update for the pharmacist.' },
          hints: ['Add the lines between “Facility: {facility}” and “Write a one-sentence…”. Use {item}, {balance} and {months_left}.', 'The three new lines: `Item: {item}`, then `Balance: {balance} packs`, then `Months of stock: {months_left}`'],
          solution: '# Inputs from the stock system\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Calculations\nbalance = received - issued\nmonths_left = round(balance / monthly_use, 1)\n\n# The prompt the AI model will read\nprompt = f"""You are Stockwise, a stock assistant.\nFacility: {facility}\nItem: {item}\nBalance: {balance} packs\nMonths of stock: {months_left}\nWrite a one-sentence status update for the pharmacist."""\nprint(prompt)',
          explain: 'That printed text is exactly what an AI model would receive. The facts come from Python, so the model can’t get the numbers wrong.',
        },
        {
          type: 'change', title: 'Step 5: a busy month',
          say: 'The phone rings. A busy month: Riverside issued far more than planned. “Update the input,” Zara says. “Watch the prompt rewrite itself.”',
          text: 'Change issued from 280 to 490 and tap **Run**.',
          code: '# Inputs from the stock system\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 280\nmonthly_use = 80\n\n# Calculations\nbalance = received - issued\nmonths_left = round(balance / monthly_use, 1)\n\n# The prompt the AI model will read\nprompt = f"""You are Stockwise, a stock assistant.\nFacility: {facility}\nItem: {item}\nBalance: {balance} packs\nMonths of stock: {months_left}\nWrite a one-sentence status update for the pharmacist."""\nprint(prompt)',
          check: { kind: 'exact', out: 'You are Stockwise, a stock assistant.\nFacility: Riverside PHC\nItem: Amoxicillin\nBalance: 110 packs\nMonths of stock: 1.4\nWrite a one-sentence status update for the pharmacist.', vars: { issued: '490' } },
          hints: ['Change only line 5.', '`issued = 490`'],
          solution: '# Inputs from the stock system\nfacility = "Riverside PHC"\nitem = "Amoxicillin"\nreceived = 600\nissued = 490\nmonthly_use = 80\n\n# Calculations\nbalance = received - issued\nmonths_left = round(balance / monthly_use, 1)\n\n# The prompt the AI model will read\nprompt = f"""You are Stockwise, a stock assistant.\nFacility: {facility}\nItem: {item}\nBalance: {balance} packs\nMonths of stock: {months_left}\nWrite a one-sentence status update for the pharmacist."""\nprint(prompt)',
          explain: 'One input changed and the whole prompt updated, with the right numbers. That’s why AI builders write code instead of pasting numbers into prompts by hand.',
        },
        {
          type: 'run', title: 'Step 6: the model replies',
          say: '“In the pilot, the model answered within a second,” Zara says. “Here’s what it wrote. Show it to the pharmacist.”',
          text: 'Tap **Run**. In Week 3 you’ll call a real model. Today we use the reply it gave in the pilot.',
          code: 'reply = "Riverside PHC has 1.4 months of amoxicillin left. Please order more this week."\nprint(f"Stockwise: {reply}")',
          check: { kind: 'ran' },
          explain: 'Prompt in, reply out, shown to the user. You’ve now seen the whole shape of an AI app, end to end.',
        },
        {
          type: 'quiz', title: 'What comes next?',
          say: 'Zara leans on the whiteboard. “One question before we celebrate.”',
          text: 'Months of stock is 1.4 and the rule is “alert below 2 months”. How should Stockwise decide when to send an alert?',
          options: ['Python checks the number and decides', 'Send every number to the model and hope', 'A person checks every facility by hand'], answer: 0,
          explain: 'Rules that must always be right belong in code. Next week you’ll teach Python to decide with if and else, like a Condition in Power Automate.',
        },
      ],
    },
  ];

  const normOut = (s) => String(s || '').replace(/[ \t]+$/gm, '').replace(/\n+$/, '');

  // Checks a code step. Returns {ok, reason, message?, expected?, got?}.
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
