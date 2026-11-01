// Compares MiniPy against real CPython on many snippets: output, error type, message and line.
// Run: node python-steps/tests/test-minipy.mjs   (needs python3 on PATH)
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(readFileSync(path.join(here, '../src/minipy.js'), 'utf8'), ctx);
const MiniPy = ctx.MiniPy;

export function runPython(code) {
  const r = spawnSync('python3', ['-I', '-c', code], { encoding: 'utf8', timeout: 10000 });
  const stderr = r.stderr || '';
  let error = null;
  if (r.status !== 0 && stderr.trim()) {
    const lines = stderr.trimEnd().split('\n');
    const last = lines[lines.length - 1];
    const m = /^(\w+)(?:: (.*))?$/.exec(last);
    const lineNums = [...stderr.matchAll(/File "<string>", line (\d+)/g)].map((x) => Number(x[1]));
    error = { type: m ? m[1] : last, message: m && m[2] !== undefined ? m[2] : '', line: lineNums.length ? lineNums[lineNums.length - 1] : 0 };
  }
  return { output: r.stdout, error };
}

const CASES = [
  // printing and numbers
  'print("Hello from Python")',
  'print(2 + 3)\nprint("2 + 3")',
  'print(10 / 2)\nprint(7 / 2)\nprint(7 // 2)\nprint(-7 // 2)\nprint(7 % 3)\nprint(-7 % 3)\nprint(7 % -3)',
  'print(2 ** 10)\nprint(2 ** -1)\nprint(2.5 ** 2)\nprint(-2 ** 2)',
  'print(0.1 + 0.2)\nprint(1/3)\nprint(1e16)\nprint(1.5e-5)\nprint(123456789.0)\nprint(100.0)\nprint(-0.0)',
  'print(round(2.857142, 1))\nprint(round(1.25, 1))\nprint(round(2.5))\nprint(round(3.5))\nprint(round(2.675, 2))\nprint(round(1000/350, 1))\nprint(round(7))\nprint(round(1234, -2))',
  'print(round(4.0, 1))\nprint(round(320/80, 1))\nprint(round(110/80, 1))\nprint(round(0.125, 2))',
  'print(True + 1)\nprint(int("42") + 1)\nprint(float("3.5"))\nprint(int(3.9))\nprint(int(-3.9))\nprint(str(120) + " packs")',
  'print(abs(-5), abs(-2.5))\nprint(min(3, 1, 2), max([4, 9, 2]))\nprint(sum([1, 2, 3]))\nprint(sum([0.5, 1]))',
  'x = 5\nx += 2\nx *= 3\nx -= 1\nx //= 4\nprint(x)\ny = 10\ny /= 4\nprint(y)',
  'print(1, 2, 3)\nprint("a", "b", sep="-")\nprint("no newline", end="")\nprint("!")\nprint()',
  // strings
  'item = "zinc tablets"\nprint(item.upper())\nprint(item.title())\nprint(len(item))\nprint(item.capitalize())',
  'print("ORS" + "sachets")\nprint("ab" * 3)\nprint(3 * "-")',
  'name = "Amoxicillin"\nprint(len(name))\nprint(name[0], name[-1], name[2:5], name[::-1])',
  'item = "   ors sachets   "\nprint(item.strip().upper())\nprint(item.lstrip() + "|")\nprint("|" + item.rstrip())',
  'print("market road health post".title())\nprint("o\'neil\'s DATA".title())\nprint("a-b c".title())',
  's = "a,b,,c"\nprint(s.split(","))\nprint("  one two   three ".split())\nprint("x y z".split(" ", 1))\nprint("-".join(["a", "b", "c"]))',
  'print("hello".replace("l", "L"))\nprint("hello".replace("l", "L", 1))\nprint("stock".startswith("st"), "stock".endswith("k"))\nprint("banana".count("a"), "banana".find("n"), "banana".find("z"))',
  'print("12".isdigit(), "1a".isdigit(), "abc".isalpha(), "ABC".isupper(), "abc".islower())',
  'print("Stock: {} packs".format(120))\nprint("{0}-{1}-{0}".format("a", "b"))\nprint("{name} has {n}".format(name="PHC", n=3))',
  'print(repr("it\'s"))\nprint(repr(\'say "hi"\'))\nprint(repr("tab\\there"))\nprint(["a", \'b\'])',
  // f-strings
  'facility = "Riverside PHC"\nstock = 120\nprint(f"{facility} has {stock} packs")',
  'print(f"{2 + 3} items")\nx = 3.14159\nprint(f"{x:.2f} {x:.0f} {x:8.3f}|{x:<8.1f}|{x:^9.2f}|")',
  'n = 1234567\nprint(f"{n:,}")\nprint(f"{n:_}")\nprint(f"{0.256:.1%}")\nprint(f"{42:05d}")\nprint(f"{-42:+d} {42:+d}")\nprint(f"{\'ab\':>5}|{\'ab\':<5}|{\'ab\':*^6}|")',
  'v = 7\nprint(f"{v=}")\nprint(f"{v!r} {\'x\'!r}")\nprint(f"{{literal}} {v}")\nw = 10\nprint(f"{v:{w}}|")',
  'price = 2.5\nprint(f"Cost: {price * 4:.2f}")\nprint(f"{1000000.0}")\nprint(f"{3.0}")\nprint(f"{12.5:g} {0.0001234:g} {123456789.0:g}")',
  // lists, tuples, dicts
  'stock = [120, 80, 45]\nstock.append(60)\nprint(stock)\nprint(len(stock), stock[1], stock[-1])\nstock.sort()\nprint(stock)\nstock.sort(reverse=True)\nprint(stock)',
  'xs = [3, 1, 2]\nprint(sorted(xs), xs)\nprint(xs.pop(), xs)\nxs.insert(0, 9)\nprint(xs, xs.index(9), xs.count(1))\nxs.remove(1)\nprint(xs)',
  'nums = list(range(10))\nprint(nums[2:5], nums[:3], nums[7:], nums[::3], nums[::-2])',
  't = (1, 2)\nprint(t, (1,), ())\na, b = t\nprint(a, b)\nfor i, v in enumerate(["x", "y"]):\n    print(i, v)',
  'd = {"ORS": 340, "Zinc": 120}\nprint(d)\nprint(d["ORS"])\nd["ACT"] = 50\nprint(d.get("ACT"), d.get("RDT"), d.get("RDT", 0))\nprint(list(d.keys()))\nprint(d.items())\nfor k, v in d.items():\n    print(k, v)',
  'd = {}\nd["a"] = 1\nd["a"] += 5\nprint(d, len(d), "a" in d, "b" in d)\nprint(d.pop("a"), d)',
  'squares = [n * n for n in range(5)]\nprint(squares)\nevens = [n for n in range(10) if n % 2 == 0]\nprint(evens)\nprint({k: len(k) for k in ["ab", "c"]})\nprint(sum(x for x in range(4)))',
  'print(list(zip([1, 2, 3], "ab")))\nprint(list(map(str, [1, 2])))\nprint(any([0, 1]), all([1, 0]))\nprint(max(["bb", "a", "ccc"], key=len))',
  'print(type(5), type(2.0), type("a"), type([]), type({}), type(None), type(True))\nprint(isinstance(5, int), isinstance(True, int), isinstance("a", (int, str)))',
  // control flow
  'stock = 45\nif stock < 50:\n    print("Low")\nelif stock < 100:\n    print("OK")\nelse:\n    print("High")',
  'for facility in ["A", "B"]:\n    for item in [1, 2]:\n        print(facility, item)\nprint("done")',
  'i = 0\nwhile i < 5:\n    i += 1\n    if i == 2:\n        continue\n    if i == 4:\n        break\n    print(i)\nelse:\n    print("no break")',
  'for i in range(3):\n    pass\nelse:\n    print("loop finished", i)',
  'x = 5 if 3 > 2 else 0\nprint(x)\nprint(1 < 2 < 3, 3 > 2 > 2, 1 == 1.0, "a" != "b", not True)\nprint(0 or "default", 5 and 6, None or 0)',
  // functions
  'def months_left(stock, monthly_use):\n    return round(stock / monthly_use, 1)\n\nprint(months_left(320, 80))\nprint(months_left(monthly_use=30, stock=100))',
  'def greet(name="team"):\n    print("Hello", name)\n\ngreet()\ngreet("store")\nr = greet()\nprint(r)',
  'def fact(n):\n    return 1 if n <= 1 else n * fact(n - 1)\nprint(fact(10))',
  'total = 0\ndef add(x):\n    global total\n    total += x\nadd(5)\nadd(7)\nprint(total)',
  'def outer():\n    k = 3\n    def inner():\n        return k * 2\n    return inner()\nprint(outer())',
  'f = lambda x, y=2: x * y\nprint(f(3), f(3, 4))\nprint(sorted([(1, "b"), (0, "a")], key=lambda p: p[1]))',
  // exceptions
  'try:\n    x = int("abc")\nexcept ValueError as e:\n    print("Bad number:", e)\nfinally:\n    print("checked")',
  'try:\n    print(10 / 0)\nexcept ZeroDivisionError:\n    print("no zero")\nelse:\n    print("fine")',
  'try:\n    d = {}\n    d["x"]\nexcept KeyError as e:\n    print("missing", e)\ntry:\n    [1][5]\nexcept LookupError as e:\n    print(type(e), e)',
  'try:\n    raise ValueError("stock cannot be negative")\nexcept Exception as e:\n    print(e, e.args)',
  'try:\n    undefined_name\nexcept NameError as e:\n    print(e)',
  'import math\nprint(math.sqrt(16), math.floor(2.7), math.ceil(2.1), math.pi)\nfrom math import sqrt\nprint(sqrt(2))',
  // runtime errors
  'stock = 120\nprint("Stock: " + stock)',
  'issued = 45\nprint("Issued: " + issued + " packs")',
  'print(5 + "a")',
  'print("5" - 2)',
  'facility = "Hilltop Clinic"\nprint(Facility)',
  'stock = 120\nprint(stok)',
  'Print("Facility open")',
  'pritn("x")',
  'math.sqrt(4)',
  'facility = "riverside phc"\nprint(facility.Upper())',
  'x = "abc"\nx.foo()',
  'print(10 / 0)',
  'print(10 // 0)',
  'print(10 % 0)',
  'print([1, 2][5])',
  'print("abc"[10])',
  'd = {"a": 1}\nprint(d["b"])',
  'print(int("3.5"))',
  'print(float("abc"))',
  'x = None\nx.upper()',
  'def f(a, b):\n    return a + b\nf(1)',
  'def f(a):\n    return a\nf(1, 2)',
  'def f():\n    return 1\nf(1)',
  'def f(a, b=1):\n    return a\nf(1, 2, 3)',
  'def f(a):\n    return a\nf(b=2)',
  'def f(a, b, c):\n    pass\nf()',
  'count = 0\ndef inc():\n    count += 1\ninc()',
  'n = 5\nn()',
  'len(5)',
  'a, b = 1, 2, 3',
  'a, b, c = 1, 2',
  'x = [1, 2]\nx["a"]',
  '"abc"["a"]',
  's = "abc"\ns[0] = "z"',
  'print(sum(["a", "b"]))',
  'print(", ".join([1, 2]))',
  'print(max([]))',
  '[1, 2].remove(5)',
  '[].pop()',
  'print(1 < "a")',
  'print(sorted([3, "a"]))',
  'x = 1\nx.y = 2',
  'import pandas_is_not_here',
  'raise ValueError("custom")',
  'def deep(n):\n    return deep(n + 1)\ndeep(0)',
  // syntax and indentation errors
  'print("Stock check complete)',
  'print("Report ready"',
  'print(len("a"',
  'packs = 120\ncartons = 3\ntotal = packs x cartons\nprint(total)',
  'item = "Zinc tablets"\n    print(item)',
  'if True:\nprint("x")',
  'for i in range(3)\n    print(i)',
  'if x = 5:\n    pass',
  'print "hello"',
  'stock count = 5',
  'print("Stock:" stock)',
  'x = [1, 2 3]',
  'x = (1, 2]',
  'x = 5)',
  'x = 007',
  'x = 3abc',
  'stock =',
  '5 = x',
  'f() = 3',
  'x = 5 if True',
  'def f(a=1, b):\n    pass',
  'return 5',
  'break',
  'if True:\n        x = 1\n    y = 2',
  'else:\n    pass',
  'x = $5',
  'print(f"{}")',
  'try:\n    pass\nprint(1)',
  'received = 300\nused = 120\nbalance = received - Used\nprint(f"Balance: {balance}"',
];

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
let pass = 0, fail = 0;
const failures = [];
for (const code of isMain ? CASES : []) {
  const py = runPython(code);
  const mp = MiniPy.run(code);
  const pe = py.error, me = mp.error;
  const problems = [];
  if (py.output !== mp.output) problems.push(`output\n   python: ${JSON.stringify(py.output)}\n   minipy: ${JSON.stringify(mp.output)}`);
  if (!!pe !== !!me) problems.push(`error presence: python=${pe ? pe.type + ': ' + pe.message : 'none'} minipy=${me ? me.type + ': ' + me.message : 'none'}`);
  else if (pe && me) {
    if (pe.type !== me.type) problems.push(`error type: python=${pe.type} minipy=${me.type}`);
    if (pe.message !== me.message) problems.push(`message\n   python: ${pe.message}\n   minipy: ${me.message}`);
    if (pe.line !== me.line) problems.push(`line: python=${pe.line} minipy=${me.line}`);
  }
  if (problems.length) { fail++; failures.push({ code, problems }); } else pass++;
}
if (isMain) {
  for (const f of failures) {
    console.log('---- FAIL ----\n' + f.code + '\n' + f.problems.map((p) => ' * ' + p).join('\n'));
  }
  console.log(`\n${pass} passed, ${fail} failed, ${CASES.length} total`);
  process.exit(fail ? 1 : 0);
}
