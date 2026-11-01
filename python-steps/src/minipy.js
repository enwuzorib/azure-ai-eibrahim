/* MiniPy: a small, safe Python interpreter for the Python Steps lessons.
   It runs a beginner subset of Python 3 inside the page: no eval, no network, nothing to install.
   Covered: numbers, text, f-strings, lists, tuples, dictionaries, if/elif/else, for and while
   loops, functions, try/except and the common built-ins. Error messages follow CPython 3.13
   wording, and the test suite in tests/ checks the output against real Python. */
(function (root) {
  'use strict';

  // ------------------------------------------------------------------ errors and signals
  class PyError extends Error {
    constructor(type, message, line, exc) {
      super(type + ': ' + message);
      this.pyType = type;      // e.g. 'NameError'
      this.pyMsg = message;    // what the traceback shows
      this.line = line || 0;
      this.exc = exc || null;  // PyExc object once caught or raised by user code
      this.argMsg = null;      // str(e) when it differs from the display message
      this.keyArg = undefined; // KeyError key
    }
  }
  class ReturnSignal { constructor(value) { this.value = value; } }
  const BREAK = { signal: 'break' };
  const CONTINUE = { signal: 'continue' };
  const TE = (m) => new PyError('TypeError', m);
  const VE = (m) => new PyError('ValueError', m);
  const LIMIT = (m) => new PyError('AppLimit', m);

  // ------------------------------------------------------------------ values
  class PyFloat { constructor(v) { this.v = v; } }
  class PyTuple { constructor(items) { this.items = items; } }
  class PyDict {
    constructor() { this.m = new Map(); }
    get size() { return this.m.size; }
    find(k) { return this.m.get(hashKey(k)); }
    set(k, v) { const h = hashKey(k); const e = this.m.get(h); if (e) e[1] = v; else this.m.set(h, [k, v]); }
    has(k) { return this.m.has(hashKey(k)); }
    del(k) { return this.m.delete(hashKey(k)); }
    keys() { return Array.from(this.m.values(), (e) => e[0]); }
    values() { return Array.from(this.m.values(), (e) => e[1]); }
    entries() { return Array.from(this.m.values()); }
  }
  class PyDictView {
    constructor(d, kind) { this.d = d; this.kind = kind; }
    list() {
      if (this.kind === 'keys') return this.d.keys();
      if (this.kind === 'values') return this.d.values();
      return this.d.entries().map((e) => new PyTuple([e[0], e[1]]));
    }
  }
  class PyRange {
    constructor(start, stop, step) {
      this.start = start; this.stop = stop; this.step = step;
      const n = step > 0 ? Math.ceil((stop - start) / step) : Math.ceil((start - stop) / -step);
      this.length = Math.max(0, n);
    }
    at(i) { return this.start + i * this.step; }
  }
  class PyFunction {
    constructor(name, params, defaults, body, locals, globalsDecl, closure) {
      this.name = name; this.params = params; this.defaults = defaults; this.body = body;
      this.locals = locals; this.globalsDecl = globalsDecl; this.closure = closure;
    }
  }
  class PyBuiltin { constructor(name, fn, isType) { this.name = name; this.fn = fn; this.isType = !!isType; } }
  class PyBound { constructor(self, owner, name, fn) { this.self = self; this.owner = owner; this.name = name; this.fn = fn; } }
  class PyModule { constructor(name, attrs) { this.name = name; this.attrs = attrs; } }
  class PyExcType { constructor(name, parent) { this.name = name; this.parent = parent; } }
  class PyExc { constructor(cls, args) { this.cls = cls; this.args = args; } }

  const EXC = Object.create(null);
  [['BaseException', null], ['Exception', 'BaseException'], ['ArithmeticError', 'Exception'],
    ['ZeroDivisionError', 'ArithmeticError'], ['OverflowError', 'ArithmeticError'],
    ['LookupError', 'Exception'], ['KeyError', 'LookupError'], ['IndexError', 'LookupError'],
    ['ValueError', 'Exception'], ['TypeError', 'Exception'], ['NameError', 'Exception'],
    ['UnboundLocalError', 'NameError'], ['AttributeError', 'Exception'], ['RuntimeError', 'Exception'],
    ['RecursionError', 'RuntimeError'], ['NotImplementedError', 'RuntimeError'],
    ['ImportError', 'Exception'], ['ModuleNotFoundError', 'ImportError'],
    ['AssertionError', 'Exception'], ['StopIteration', 'Exception']
  ].forEach(([n, p]) => { EXC[n] = new PyExcType(n, p ? EXC[p] : null); });
  const isSub = (c, base) => { for (; c; c = c.parent) if (c === base) return true; return false; };

  // Names copied from CPython 3.13 so "Did you mean" suggestions match real Python.
  const BUILTIN_NAMES = ('__name__ __doc__ __package__ __loader__ __spec__ __build_class__ __import__ abs all any ascii bin breakpoint callable chr compile delattr dir divmod eval exec format getattr globals hasattr hash hex id input isinstance issubclass iter aiter len locals max min next anext oct ord pow print repr round setattr sorted sum vars None Ellipsis NotImplemented False True bool memoryview bytearray bytes classmethod complex dict enumerate filter float frozenset property int list map object range reversed set slice staticmethod str super tuple type zip __debug__ BaseException BaseExceptionGroup Exception GeneratorExit KeyboardInterrupt SystemExit ArithmeticError AssertionError AttributeError BufferError EOFError ImportError LookupError MemoryError NameError OSError ReferenceError RuntimeError StopAsyncIteration StopIteration SyntaxError SystemError TypeError ValueError Warning FloatingPointError OverflowError ZeroDivisionError BytesWarning DeprecationWarning EncodingWarning FutureWarning ImportWarning PendingDeprecationWarning ResourceWarning RuntimeWarning SyntaxWarning UnicodeWarning UserWarning BlockingIOError ChildProcessError ConnectionError FileExistsError FileNotFoundError InterruptedError IsADirectoryError NotADirectoryError PermissionError ProcessLookupError TimeoutError IndentationError _IncompleteInputError IndexError KeyError ModuleNotFoundError NotImplementedError PythonFinalizationError RecursionError UnboundLocalError UnicodeError BrokenPipeError ConnectionAbortedError ConnectionRefusedError ConnectionResetError TabError UnicodeDecodeError UnicodeEncodeError UnicodeTranslateError ExceptionGroup EnvironmentError IOError open quit exit copyright credits license help').split(' ');
  const MODULE_GLOBALS = ['__name__', '__doc__', '__package__', '__loader__', '__spec__', '__annotations__', '__builtins__'];
  const DIR = {
    str: 'capitalize casefold center count encode endswith expandtabs find format format_map index isalnum isalpha isascii isdecimal isdigit isidentifier islower isnumeric isprintable isspace istitle isupper join ljust lower lstrip maketrans partition removeprefix removesuffix replace rfind rindex rjust rpartition rsplit rstrip split splitlines startswith strip swapcase title translate upper zfill',
    list: 'append clear copy count extend index insert pop remove reverse sort',
    dict: 'clear copy fromkeys get items keys pop popitem setdefault update values',
    tuple: 'count index',
    int: 'as_integer_ratio bit_count bit_length conjugate denominator from_bytes imag is_integer numerator real to_bytes',
    bool: 'as_integer_ratio bit_count bit_length conjugate denominator from_bytes imag is_integer numerator real to_bytes',
    float: 'as_integer_ratio conjugate fromhex hex imag is_integer real',
  };
  for (const k in DIR) DIR[k] = DIR[k].split(' ');
  const STDLIB = new Set(['math', 'random', 'time', 'os', 'sys', 'datetime', 'json', 're', 'statistics', 'string', 'csv', 'collections', 'itertools', 'functools', 'decimal', 'fractions']);

  // ------------------------------------------------------------------ helpers
  function typeName(v) {
    if (v === null) return 'NoneType';
    switch (typeof v) { case 'boolean': return 'bool'; case 'number': return 'int'; case 'string': return 'str'; }
    if (Array.isArray(v)) return 'list';
    if (v instanceof PyFloat) return 'float';
    if (v instanceof PyTuple) return 'tuple';
    if (v instanceof PyDict) return 'dict';
    if (v instanceof PyRange) return 'range';
    if (v instanceof PyDictView) return 'dict_' + v.kind;
    if (v instanceof PyFunction) return 'function';
    if (v instanceof PyBuiltin) return v.isType ? 'type' : 'builtin_function_or_method';
    if (v instanceof PyBound) return 'builtin_function_or_method';
    if (v instanceof PyModule) return 'module';
    if (v instanceof PyExcType) return 'type';
    if (v instanceof PyExc) return v.cls.name;
    return 'object';
  }
  const isInt = (v) => typeof v === 'number' || typeof v === 'boolean';
  const isNum = (v) => typeof v === 'number' || typeof v === 'boolean' || v instanceof PyFloat;
  const num = (v) => (typeof v === 'number' ? v : typeof v === 'boolean' ? (v ? 1 : 0) : v.v);
  const mk = (x, f) => (f ? new PyFloat(x) : x);

  function hashKey(v) {
    if (typeof v === 'string') return 's' + v;
    if (typeof v === 'number') return 'n' + v;
    if (typeof v === 'boolean') return 'n' + (v ? 1 : 0);
    if (v instanceof PyFloat) return 'n' + v.v;
    if (v === null) return 'N';
    if (v instanceof PyTuple) return 't(' + v.items.map(hashKey).join(',') + ')';
    if (v instanceof PyExcType || v instanceof PyBuiltin || v instanceof PyFunction) return 'o' + typeName(v) + ':' + (v.name || '');
    throw TE(`unhashable type: '${typeName(v)}'`);
  }

  function truthy(v) {
    if (v === null || v === false) return false;
    if (v === true) return true;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return v.length > 0;
    if (v instanceof PyFloat) return v.v !== 0;
    if (Array.isArray(v)) return v.length > 0;
    if (v instanceof PyTuple) return v.items.length > 0;
    if (v instanceof PyDict) return v.size > 0;
    if (v instanceof PyRange) return v.length > 0;
    if (v instanceof PyDictView) return v.list().length > 0;
    return true;
  }

  function intStr(n) { return Math.abs(n) >= 1e21 ? BigInt(n).toString() : String(n); }
  function floatRepr(x) {
    if (Number.isNaN(x)) return 'nan';
    if (x === Infinity) return 'inf';
    if (x === -Infinity) return '-inf';
    if (x === 0) return Object.is(x, -0) ? '-0.0' : '0.0';
    const ax = Math.abs(x);
    if (ax >= 1e16 || ax < 1e-4) return x.toExponential().replace(/e([+-])(\d)$/, 'e$10$2');
    const s = String(x);
    return s.includes('.') ? s : s + '.0';
  }
  function strRepr(s) {
    const q = s.includes("'") && !s.includes('"') ? '"' : "'";
    let out = q;
    for (const ch of s) {
      if (ch === '\\') out += '\\\\';
      else if (ch === q) out += '\\' + q;
      else if (ch === '\n') out += '\\n';
      else if (ch === '\r') out += '\\r';
      else if (ch === '\t') out += '\\t';
      else {
        const c = ch.codePointAt(0);
        out += c < 32 || c === 127 ? '\\x' + c.toString(16).padStart(2, '0') : ch;
      }
    }
    return out + q;
  }
  function pyRepr(v, seen) {
    if (v === null) return 'None';
    if (v === true) return 'True';
    if (v === false) return 'False';
    if (typeof v === 'number') return intStr(v);
    if (typeof v === 'string') return strRepr(v);
    if (v instanceof PyFloat) return floatRepr(v.v);
    seen = seen || new Set();
    if (Array.isArray(v)) {
      if (seen.has(v)) return '[...]';
      seen.add(v); const s = '[' + v.map((x) => pyRepr(x, seen)).join(', ') + ']'; seen.delete(v); return s;
    }
    if (v instanceof PyTuple) {
      const inner = v.items.map((x) => pyRepr(x, seen));
      return inner.length === 1 ? '(' + inner[0] + ',)' : '(' + inner.join(', ') + ')';
    }
    if (v instanceof PyDict) {
      if (seen.has(v)) return '{...}';
      seen.add(v);
      const s = '{' + v.entries().map(([k, x]) => pyRepr(k, seen) + ': ' + pyRepr(x, seen)).join(', ') + '}';
      seen.delete(v); return s;
    }
    if (v instanceof PyDictView) return 'dict_' + v.kind + '(' + pyRepr(v.list(), seen) + ')';
    if (v instanceof PyRange) return v.step === 1 ? `range(${v.start}, ${v.stop})` : `range(${v.start}, ${v.stop}, ${v.step})`;
    if (v instanceof PyFunction) return `<function ${v.name} at 0x7f3a2c1b0040>`;
    if (v instanceof PyBuiltin) return v.isType ? `<class '${v.name}'>` : `<built-in function ${v.name}>`;
    if (v instanceof PyBound) return `<built-in method ${v.name} of ${v.owner} object at 0x7f3a2c1b0080>`;
    if (v instanceof PyModule) return `<module '${v.name}' (built-in)>`;
    if (v instanceof PyExcType) return `<class '${v.name}'>`;
    if (v instanceof PyExc) return v.cls.name + '(' + v.args.map((x) => pyRepr(x, seen)).join(', ') + ')';
    return String(v);
  }
  function excStr(e) {
    if (e.args.length === 0) return '';
    if (e.args.length === 1) return e.cls === EXC.KeyError ? pyRepr(e.args[0]) : pyStr(e.args[0]);
    return pyRepr(new PyTuple(e.args));
  }
  function pyStr(v) {
    if (typeof v === 'string') return v;
    if (v instanceof PyExc) return excStr(v);
    return pyRepr(v);
  }

  // ------------------------------------------------------------------ number formatting
  function fixedHalfEven(x, p) { // x >= 0, Python-style rounding of the exact binary value
    p = Math.max(0, Math.min(p, 100));
    if (x >= 1e21) return BigInt(Math.round(x)).toString() + (p ? '.' + '0'.repeat(p) : '');
    const s = x.toFixed(p);
    if (p + 25 <= 100) {
      const ext = x.toFixed(p + 25);
      const dot = ext.indexOf('.');
      const tail = ext.slice(dot + 1 + p);
      if (tail === '5' + '0'.repeat(24)) {
        const trunc = ext.slice(0, p ? dot + 1 + p : dot);
        const last = trunc.replace('.', '').slice(-1);
        if (Number(last) % 2 === 0) return trunc;
      }
    }
    return s;
  }
  function expForm(x, p, upper) {
    let s = x.toExponential(Math.max(0, Math.min(p, 100))).replace(/e([+-])(\d)$/, 'e$10$2');
    return upper ? s.toUpperCase() : s;
  }
  function gForm(x, p, alt, upper) {
    if (p === 0) p = 1;
    const exp = x === 0 ? 0 : parseInt(x.toExponential(p - 1).split('e')[1], 10);
    let s;
    if (exp >= -4 && exp < p) {
      s = fixedHalfEven(x, p - 1 - exp);
      if (!alt && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    } else {
      s = x.toExponential(p - 1);
      let [m, e] = s.split('e');
      if (!alt && m.includes('.')) m = m.replace(/0+$/, '').replace(/\.$/, '');
      s = m + 'e' + e.replace(/^([+-])(\d)$/, '$10$2');
      if (upper) s = s.toUpperCase();
    }
    return s;
  }
  function formatSpec(v, spec) {
    if (spec === '') return pyStr(v);
    const m = /^(?:([\s\S])?([<>=^]))?([+\- ])?(#)?(0)?(\d+)?([,_])?(?:\.(\d+))?([bcdeEfFgGnosxX%])?$/.exec(spec);
    if (!m) throw VE('Invalid format specifier');
    let [, fill, align, sign, alt, zero, width, group, prec, type] = m;
    width = width ? parseInt(width, 10) : 0;
    prec = prec !== undefined ? parseInt(prec, 10) : undefined;
    let body, neg = false, isNumber = false;
    if (typeof v === 'string') {
      if (type && type !== 's') throw VE(`Unknown format code '${type}' for object of type 'str'`);
      if (sign) throw VE('Sign not allowed in string format specifier');
      body = prec !== undefined ? Array.from(v).slice(0, prec).join('') : v;
      if (!align) align = '<';
    } else if (isNum(v)) {
      isNumber = true;
      const fl = v instanceof PyFloat;
      let x = num(v);
      if (!type) type = fl ? (prec !== undefined ? 'G0' : 'R') : 'd';
      if (type === 's' || type === 'c' && fl) throw VE(`Unknown format code '${type}' for object of type '${typeName(v)}'`);
      if ('dbox'.includes(type) && type !== 'G0' && fl) throw VE(`Unknown format code '${type}' for object of type 'float'`);
      neg = x < 0 || Object.is(x, -0);
      const ax = Math.abs(x);
      switch (type) {
        case 'd': case 'n': body = intStr(ax); break;
        case 'b': body = ax.toString(2); if (alt) body = '0b' + body; break;
        case 'o': body = ax.toString(8); if (alt) body = '0o' + body; break;
        case 'x': case 'X': body = ax.toString(16); if (alt) body = '0x' + body; if (type === 'X') body = body.toUpperCase(); break;
        case 'c': body = String.fromCodePoint(ax); neg = false; break;
        case 'f': case 'F': body = Number.isFinite(ax) ? fixedHalfEven(ax, prec === undefined ? 6 : prec) : (Number.isNaN(ax) ? 'nan' : 'inf'); if (type === 'F') body = body.toUpperCase(); break;
        case 'e': case 'E': body = expForm(ax, prec === undefined ? 6 : prec, type === 'E'); break;
        case '%': body = fixedHalfEven(ax * 100, prec === undefined ? 6 : prec) + '%'; break;
        case 'g': case 'G': body = gForm(ax, prec === undefined ? 6 : prec, !!alt, type === 'G'); break;
        case 'G0': body = gForm(ax, prec, !!alt, false); if (!/[.e]|inf|nan/.test(body)) body += '.0'; break;
        case 'R': body = floatRepr(ax); break;
        default: throw VE(`Unknown format code '${type}' for object of type '${typeName(v)}'`);
      }
      if (group) {
        const di = body.search(/[.e%]/);
        const ip = di < 0 ? body : body.slice(0, di);
        if (/^\d+$/.test(ip)) body = ip.replace(/\B(?=(\d{3})+(?!\d))/g, group) + (di < 0 ? '' : body.slice(di));
      }
      if (!align) align = zero && !fill ? '=' : '>';
      if (zero && !fill) fill = '0';
    } else {
      throw TE(`unsupported format string passed to ${typeName(v)}.__format__`);
    }
    let signStr = '';
    if (isNumber) signStr = neg ? '-' : sign === '+' ? '+' : sign === ' ' ? ' ' : '';
    fill = fill === undefined ? ' ' : fill;
    const len = Array.from(signStr + body).length;
    const pad = Math.max(0, width - len);
    if (align === '<') return signStr + body + fill.repeat(pad);
    if (align === '>') return fill.repeat(pad) + signStr + body;
    if (align === '=') return signStr + fill.repeat(pad) + body;
    const left = Math.floor(pad / 2);
    return fill.repeat(left) + signStr + body + fill.repeat(pad - left);
  }

  function roundNum(v, nd) {
    if (!isNum(v)) throw TE(`type ${typeName(v)} doesn't define __round__ method`);
    const fl = v instanceof PyFloat;
    const x = num(v);
    if (nd === undefined || nd === null) {
      if (!fl) return x;
      if (!Number.isFinite(x)) throw new PyError(Number.isNaN(x) ? 'ValueError' : 'OverflowError', Number.isNaN(x) ? 'cannot convert float NaN to integer' : 'cannot convert float infinity to integer');
      const s = fixedHalfEven(Math.abs(x), 0);
      const r = Number(s);
      return x < 0 ? -r : r;
    }
    if (!isInt(nd)) throw TE(`'${typeName(nd)}' object cannot be interpreted as an integer`);
    const d = num(nd);
    if (!fl) {
      if (d >= 0) return x;
      const f = Math.pow(10, -d);
      const q = Number(fixedHalfEven(Math.abs(x) / f, 0)) * f;
      return x < 0 ? -q : q;
    }
    if (!Number.isFinite(x)) return v;
    if (d >= 0) { const r = Number(fixedHalfEven(Math.abs(x), d)); return new PyFloat(x < 0 ? -r : r); }
    const f = Math.pow(10, -d);
    const q = Number(fixedHalfEven(Math.abs(x) / f, 0)) * f;
    return new PyFloat(x < 0 ? -q : q);
  }

  // ------------------------------------------------------------------ operators
  const isSeq = (v) => typeof v === 'string' || Array.isArray(v) || v instanceof PyTuple;
  function repeatSeq(a, n) {
    n = Math.max(0, n);
    if (typeof a === 'string') { if (a.length * n > 1e6) throw new PyError('MemoryError', ''); return a.repeat(n); }
    const items = Array.isArray(a) ? a : a.items;
    if (items.length * n > 1e6) throw new PyError('MemoryError', '');
    let out = []; for (let i = 0; i < n; i++) out = out.concat(items);
    return Array.isArray(a) ? out : new PyTuple(out);
  }
  function binop(op, a, b) {
    if (isNum(a) && isNum(b)) {
      const x = num(a), y = num(b), fl = a instanceof PyFloat || b instanceof PyFloat;
      switch (op) {
        case '+': return mk(x + y, fl);
        case '-': return mk(x - y, fl);
        case '*': return mk(x * y, fl);
        case '/': if (y === 0) throw new PyError('ZeroDivisionError', 'division by zero'); return new PyFloat(x / y);
        case '//': if (y === 0) throw new PyError('ZeroDivisionError', fl ? 'float floor division by zero' : 'integer division or modulo by zero'); return mk(Math.floor(x / y), fl);
        case '%': {
          if (y === 0) throw new PyError('ZeroDivisionError', fl ? 'float modulo by zero' : 'integer modulo by zero');
          let r = x % y; if (r !== 0 && (r < 0) !== (y < 0)) r += y; return mk(r, fl);
        }
        case '**':
          if (!fl && y < 0) { if (x === 0) throw new PyError('ZeroDivisionError', '0.0 cannot be raised to a negative power'); return new PyFloat(Math.pow(x, y)); }
          if (fl && x === 0 && y < 0) throw new PyError('ZeroDivisionError', '0.0 cannot be raised to a negative power');
          return mk(Math.pow(x, y), fl);
        case '&': if (!fl) return x & y; break;
        case '|': if (!fl) return x | y; break;
        case '^': if (!fl) return x ^ y; break;
        case '<<': if (!fl) return x * Math.pow(2, y); break;
        case '>>': if (!fl) return Math.floor(x / Math.pow(2, y)); break;
      }
    }
    if (op === '+') {
      if (typeof a === 'string' && typeof b === 'string') return a + b;
      if (Array.isArray(a) && Array.isArray(b)) return a.concat(b);
      if (a instanceof PyTuple && b instanceof PyTuple) return new PyTuple(a.items.concat(b.items));
      if (typeof a === 'string') throw TE(`can only concatenate str (not "${typeName(b)}") to str`);
      if (Array.isArray(a)) throw TE(`can only concatenate list (not "${typeName(b)}") to list`);
      if (a instanceof PyTuple) throw TE(`can only concatenate tuple (not "${typeName(b)}") to tuple`);
    }
    if (op === '*') {
      if (isSeq(a) && isInt(b)) return repeatSeq(a, num(b));
      if (isInt(a) && isSeq(b)) return repeatSeq(b, num(a));
      if (isSeq(a) && (b instanceof PyFloat || isSeq(b))) throw TE(`can't multiply sequence by non-int of type '${typeName(b)}'`);
      if (isSeq(b) && a instanceof PyFloat) throw TE(`can't multiply sequence by non-int of type '${typeName(a)}'`);
    }
    if (op === '%' && typeof a === 'string') return percentFormat(a, b);
    const sym = op === '**' ? '** or pow()' : op;
    throw TE(`unsupported operand type(s) for ${sym}: '${typeName(a)}' and '${typeName(b)}'`);
  }
  function percentFormat(fmt, arg) {
    const args = arg instanceof PyTuple ? arg.items.slice() : [arg];
    let used = 0;
    const out = fmt.replace(/%([-+ 0#]*)(\d+)?(?:\.(\d+))?([sdifrx%])/g, (all, flags, w, p, t) => {
      if (t === '%') return '%';
      if (used >= args.length) throw TE('not enough arguments for format string');
      const v = args[used++];
      let spec = (flags.includes('-') ? '<' : '') + (flags.includes('+') ? '+' : '') + (flags.includes('0') ? '0' : '') + (w || '') + (p !== undefined ? '.' + p : '');
      if (t === 's') return formatSpec(pyStr(v), spec.replace('+', ''));
      if (t === 'r') return formatSpec(pyRepr(v), spec.replace('+', ''));
      if (!isNum(v)) throw TE(`%${t} format: a real number is required, not ${typeName(v)}`);
      if (t === 'd' || t === 'i') return formatSpec(Math.trunc(num(v)), spec);
      if (t === 'x') return formatSpec(Math.trunc(num(v)), spec + 'x');
      return formatSpec(new PyFloat(num(v)), spec + (p === undefined ? '.6' : '') + 'f');
    });
    if (used < args.length) throw TE('not all arguments converted during string formatting');
    return out;
  }
  function unary(op, v) {
    if (isNum(v)) {
      const fl = v instanceof PyFloat, x = num(v);
      if (op === '-') return mk(-x, fl);
      if (op === '+') return mk(x, fl);
      if (op === '~' && !fl) return -x - 1;
    }
    throw TE(`bad operand type for unary ${op}: '${typeName(v)}'`);
  }
  function pyEq(a, b) {
    if (a === b) return true;
    if (isNum(a) && isNum(b)) return num(a) === num(b);
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => pyEq(x, b[i]));
    if (a instanceof PyTuple && b instanceof PyTuple) return a.items.length === b.items.length && a.items.every((x, i) => pyEq(x, b.items[i]));
    if (a instanceof PyDict && b instanceof PyDict) {
      if (a.size !== b.size) return false;
      for (const [k, v] of a.entries()) { const e = b.find(k); if (!e || !pyEq(v, e[1])) return false; }
      return true;
    }
    if (a instanceof PyRange && b instanceof PyRange) return a.length === b.length && (a.length === 0 || (a.start === b.start && (a.length === 1 || a.step === b.step)));
    return false;
  }
  function order(a, b, op) {
    if (isNum(a) && isNum(b)) { const x = num(a), y = num(b); return x < y ? -1 : x > y ? 1 : 0; }
    if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
    const A = Array.isArray(a) ? a : a instanceof PyTuple ? a.items : null;
    const B = Array.isArray(b) ? b : b instanceof PyTuple ? b.items : null;
    if (A && B && Array.isArray(a) === Array.isArray(b)) {
      for (let i = 0; i < Math.min(A.length, B.length); i++) if (!pyEq(A[i], B[i])) return order(A[i], B[i], op);
      return A.length - B.length < 0 ? -1 : A.length > B.length ? 1 : 0;
    }
    throw TE(`'${op}' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`);
  }
  function contains(c, x) {
    if (typeof c === 'string') {
      if (typeof x !== 'string') throw TE(`'in <string>' requires string as left operand, not ${typeName(x)}`);
      return c.includes(x);
    }
    if (Array.isArray(c)) return c.some((y) => pyEq(x, y));
    if (c instanceof PyTuple) return c.items.some((y) => pyEq(x, y));
    if (c instanceof PyDict) return c.has(x);
    if (c instanceof PyDictView) return c.kind === 'keys' ? c.d.has(x) : c.list().some((y) => pyEq(x, y));
    if (c instanceof PyRange) {
      if (!isNum(x)) return false;
      const n = num(x);
      if (!Number.isInteger(n)) return false;
      const i = (n - c.start) / c.step;
      return Number.isInteger(i) && i >= 0 && i < c.length;
    }
    throw TE(`argument of type '${typeName(c)}' is not iterable`);
  }
  function compare(op, a, b) {
    switch (op) {
      case '==': return pyEq(a, b);
      case '!=': return !pyEq(a, b);
      case '<': return order(a, b, op) < 0;
      case '<=': return order(a, b, op) <= 0;
      case '>': return order(a, b, op) > 0;
      case '>=': return order(a, b, op) >= 0;
      case 'in': return contains(b, a);
      case 'not in': return !contains(b, a);
      case 'is': return a === b || (isNum(a) && isNum(b) && !(a instanceof PyFloat) && !(b instanceof PyFloat) && typeof a === typeof b && a === b);
      case 'is not': return !(a === b);
    }
    throw new PyError('SyntaxError', 'invalid syntax');
  }

  // ------------------------------------------------------------------ iteration and items
  function* iterate(v) {
    if (v instanceof PyRange) { for (let i = 0; i < v.length; i++) yield v.at(i); return; }
    yield* toList(v);
  }
  function toList(v) {
    if (Array.isArray(v)) return v.slice();
    if (typeof v === 'string') return Array.from(v);
    if (v instanceof PyTuple) return v.items.slice();
    if (v instanceof PyDict) return v.keys();
    if (v instanceof PyDictView) return v.list();
    if (v instanceof PyRange) {
      if (v.length > 2e6) throw new PyError('MemoryError', 'range is too big for this practice app');
      const a = []; for (let i = 0; i < v.length; i++) a.push(v.at(i)); return a;
    }
    throw TE(`'${typeName(v)}' object is not iterable`);
  }
  const seqItems = (o) => (typeof o === 'string' ? (/[\uD800-\uDFFF]/.test(o) ? Array.from(o) : null) : Array.isArray(o) ? o : o.items);
  function seqLen(o) { if (typeof o === 'string') { const a = seqItems(o); return a ? a.length : o.length; } return seqItems(o).length; }
  function seqAt(o, i) { if (typeof o === 'string') { const a = seqItems(o); return a ? a[i] : o[i]; } return seqItems(o)[i]; }
  function pyLen(v) {
    if (typeof v === 'string' || Array.isArray(v) || v instanceof PyTuple) return seqLen(v);
    if (v instanceof PyDict) return v.size;
    if (v instanceof PyRange) return v.length;
    if (v instanceof PyDictView) return v.d.size;
    throw TE(`object of type '${typeName(v)}' has no len()`);
  }
  function sliceIndices(len, lo, hi, st) {
    const step = st === null ? 1 : st;
    if (step === 0) throw VE('slice step cannot be zero');
    let start, stop;
    if (step > 0) {
      start = lo === null ? 0 : lo < 0 ? Math.max(0, lo + len) : Math.min(lo, len);
      stop = hi === null ? len : hi < 0 ? Math.max(0, hi + len) : Math.min(hi, len);
    } else {
      start = lo === null ? len - 1 : lo < 0 ? Math.max(-1, lo + len) : Math.min(lo, len - 1);
      stop = hi === null ? -1 : hi < 0 ? Math.max(-1, hi + len) : Math.min(hi, len - 1);
    }
    const idx = [];
    if (step > 0) for (let i = start; i < stop; i += step) idx.push(i);
    else for (let i = start; i > stop; i += step) idx.push(i);
    return idx;
  }
  function getSlice(o, lo, hi, st) {
    if (!(isSeq(o) || o instanceof PyRange)) throw TE(`'${typeName(o)}' object is not subscriptable`);
    if (o instanceof PyRange) o = toList(o);
    const items = typeof o === 'string' ? Array.from(o) : seqItems(o);
    const idx = sliceIndices(items.length, lo, hi, st);
    const picked = idx.map((i) => items[i]);
    if (typeof o === 'string') return picked.join('');
    return Array.isArray(o) ? picked : new PyTuple(picked);
  }
  function getItem(o, k) {
    if (isSeq(o) || o instanceof PyRange) {
      const kind = typeof o === 'string' ? 'string' : Array.isArray(o) ? 'list' : o instanceof PyRange ? 'range object' : 'tuple';
      if (!isInt(k)) {
        if (typeof o === 'string') throw TE(`string indices must be integers, not '${typeName(k)}'`);
        throw TE(`${kind === 'range object' ? 'range' : kind} indices must be integers or slices, not ${typeName(k)}`);
      }
      const len = o instanceof PyRange ? o.length : seqLen(o);
      let i = num(k); if (i < 0) i += len;
      if (i < 0 || i >= len) throw new PyError('IndexError', `${kind} index out of range`);
      return o instanceof PyRange ? o.at(i) : seqAt(o, i);
    }
    if (o instanceof PyDict) {
      const e = o.find(k);
      if (!e) { const err = new PyError('KeyError', pyRepr(k)); err.keyArg = k; throw err; }
      return e[1];
    }
    throw TE(`'${typeName(o)}' object is not subscriptable`);
  }
  function setItem(o, k, v) {
    if (Array.isArray(o)) {
      if (!isInt(k)) throw TE(`list indices must be integers or slices, not ${typeName(k)}`);
      let i = num(k); if (i < 0) i += o.length;
      if (i < 0 || i >= o.length) throw new PyError('IndexError', 'list assignment index out of range');
      o[i] = v; return;
    }
    if (o instanceof PyDict) { o.set(k, v); return; }
    throw TE(`'${typeName(o)}' object does not support item assignment`);
  }

  // ------------------------------------------------------------------ "did you mean" (CPython algorithm)
  function levenshtein(a, b, maxCost) {
    const MOVE = 2, CASE = 1;
    if (a === b) return 0;
    let pre = 0; while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
    a = a.slice(pre); b = b.slice(pre);
    let post = 0; while (post < a.length && post < b.length && a[a.length - 1 - post] === b[b.length - 1 - post]) post++;
    a = a.slice(0, a.length - post); b = b.slice(0, b.length - post);
    if (!a.length || !b.length) return MOVE * (a.length + b.length);
    if (a.length > 40 || b.length > 40) return maxCost + 1;
    if (b.length < a.length) [a, b] = [b, a];
    if ((b.length - a.length) * MOVE > maxCost) return maxCost + 1;
    const sub = (x, y) => (x === y ? 0 : x.toLowerCase() === y.toLowerCase() ? CASE : MOVE);
    const row = []; for (let i = 0; i < a.length; i++) row.push((i + 1) * MOVE);
    let result = 0;
    for (let bi = 0; bi < b.length; bi++) {
      let distance = result = bi * MOVE;
      let minimum = Infinity;
      for (let i = 0; i < a.length; i++) {
        const substitute = distance + sub(b[bi], a[i]);
        distance = row[i];
        const insdel = Math.min(result, distance) + MOVE;
        result = Math.min(insdel, substitute);
        row[i] = result;
        if (result < minimum) minimum = result;
      }
      if (minimum > maxCost) return maxCost + 1;
    }
    return result;
  }
  function suggest(wrong, candidates) {
    if (candidates.length > 750) return null;
    let best = null, bestD = Infinity;
    for (const c of candidates) {
      if (c === wrong) continue;
      let maxD = Math.floor((c.length + wrong.length + 3) * 2 / 6);
      maxD = Math.min(maxD, bestD - 1);
      const d = levenshtein(wrong, c, maxD);
      if (d > maxD) continue;
      if (best === null || d < bestD) { best = c; bestD = d; }
    }
    return best;
  }

  // ------------------------------------------------------------------ tokenizer
  const KEYWORDS = new Set(['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield']);
  const OPS = ['**=', '//=', '>>=', '<<=', '...', '!=', '==', '<=', '>=', '->', ':=', '**', '//', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', '+', '-', '*', '/', '%', '@', '&', '|', '^', '~', '<', '>', '(', ')', '[', ']', '{', '}', ',', ':', '.', ';', '='];
  const CLOSE_OF = { ')': '(', ']': '[', '}': '{' };
  const ID_START = /[\p{L}_]/u, ID_CHAR = /[\p{L}\p{N}_]/u;

  function decodeEscapes(s) {
    if (!s.includes('\\')) return s;
    let out = '';
    for (let k = 0; k < s.length; k++) {
      const ch = s[k];
      if (ch !== '\\') { out += ch; continue; }
      const nx = s[++k];
      switch (nx) {
        case 'n': out += '\n'; break; case 't': out += '\t'; break; case 'r': out += '\r'; break;
        case '\\': out += '\\'; break; case "'": out += "'"; break; case '"': out += '"'; break;
        case 'a': out += '\x07'; break; case 'b': out += '\b'; break; case 'f': out += '\f'; break; case 'v': out += '\v'; break;
        case '0': out += '\0'; break;
        case '\n': break;
        case 'x': case 'u': case 'U': {
          const n = nx === 'x' ? 2 : nx === 'u' ? 4 : 8;
          const h = s.substr(k + 1, n);
          if (h.length === n && /^[0-9a-fA-F]+$/.test(h)) { out += String.fromCodePoint(parseInt(h, 16)); k += n; }
          else out += '\\' + nx;
          break;
        }
        default: out += '\\' + (nx === undefined ? '' : nx);
      }
    }
    return out;
  }

  function tokenize(src, lineOffset) {
    const toks = [];
    const n = src.length;
    const indents = [0];
    const brackets = [];
    let i = 0, line = 1 + (lineOffset || 0), atLineStart = true;
    const add = (type, value, ln, extra) => { const t = { type, value, line: ln === undefined ? line : ln }; if (extra) Object.assign(t, extra); toks.push(t); };
    const syntax = (msg, ln) => new PyError('SyntaxError', msg, ln === undefined ? line : ln);

    function readString(pos) {
      const q = src[pos];
      const triple = src.startsWith(q + q + q, pos);
      const quote = triple ? q + q + q : q;
      const startLine = line;
      let j = pos + quote.length, raw = '';
      for (;;) {
        if (j >= n) {
          if (triple) throw syntax(`unterminated triple-quoted string literal (detected at line ${line})`, startLine);
          throw syntax(`unterminated string literal (detected at line ${line})`, line);
        }
        const ch = src[j];
        if (ch === '\\') {
          const nx = src[j + 1];
          if (nx === undefined) { j++; continue; }
          raw += ch + nx; if (nx === '\n') line++; j += 2; continue;
        }
        if (src.startsWith(quote, j)) { j += quote.length; break; }
        if (ch === '\n') { if (!triple) throw syntax(`unterminated string literal (detected at line ${line})`, line); line++; }
        raw += ch; j++;
      }
      return { raw, end: j, startLine };
    }

    while (i <= n) {
      if (atLineStart && brackets.length === 0) {
        let col = 0, j = i;
        while (j < n && src[j] === ' ') { col++; j++; }
        if (j >= n) { i = n; break; }
        if (src[j] === '\n') { i = j + 1; line++; continue; }
        if (src[j] === '#') { while (j < n && src[j] !== '\n') j++; i = j; continue; }
        const top = indents[indents.length - 1];
        if (col > top) { indents.push(col); add('INDENT', col); }
        else if (col < top) {
          while (col < indents[indents.length - 1]) { indents.pop(); add('DEDENT', col); }
          if (col !== indents[indents.length - 1]) throw new PyError('IndentationError', 'unindent does not match any outer indentation level', line);
        }
        i = j; atLineStart = false;
      }
      if (i >= n) break;
      const c = src[i];
      if (c === '\n') { if (brackets.length === 0) { add('NEWLINE', null); atLineStart = true; } line++; i++; continue; }
      if (c === ' ' || c === '\f') { i++; continue; }
      if (c === '#') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '\\') {
        if (src[i + 1] === '\n') { i += 2; line++; continue; }
        throw syntax('unexpected character after line continuation character');
      }
      if (ID_START.test(c)) {
        let j = i + 1;
        while (j < n && ID_CHAR.test(src[j])) j++;
        const word = src.slice(i, j);
        if ((src[j] === '"' || src[j] === "'") && /^(r|u|f|b|br|rb|fr|rf)$/i.test(word)) {
          const p = word.toLowerCase();
          const r = readString(j);
          add('STRING', r.raw, r.startLine, { raw: p.includes('r'), f: p.includes('f') });
          i = r.end; continue;
        }
        add('NAME', word); i = j; continue;
      }
      if (c === '"' || c === "'") { const r = readString(i); add('STRING', r.raw, r.startLine, { raw: false, f: false }); i = r.end; continue; }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        let j = i, value;
        if (c === '0' && /[xXoObB]/.test(src[i + 1] || '')) {
          const base = { x: 16, o: 8, b: 2 }[src[i + 1].toLowerCase()];
          j = i + 2; while (j < n && /[0-9a-fA-F_]/.test(src[j])) j++;
          value = parseInt(src.slice(i + 2, j).replace(/_/g, ''), base);
          if (Number.isNaN(value)) throw syntax('invalid syntax');
        } else {
          while (j < n && /[0-9_]/.test(src[j])) j++;
          let isF = false;
          if (src[j] === '.' && src[j + 1] !== '.') { isF = true; j++; while (j < n && /[0-9_]/.test(src[j])) j++; }
          if (/[eE]/.test(src[j] || '') && (/[0-9]/.test(src[j + 1] || '') || (/[+-]/.test(src[j + 1] || '') && /[0-9]/.test(src[j + 2] || '')))) {
            isF = true; j += /[+-]/.test(src[j + 1]) ? 2 : 1; while (j < n && /[0-9]/.test(src[j])) j++;
          }
          const text = src.slice(i, j).replace(/_/g, '');
          if (j < n && ID_START.test(src[j])) throw syntax('invalid decimal literal');
          if (!isF && text.length > 1 && text[0] === '0' && /[1-9]/.test(text)) throw syntax('leading zeros in decimal integer literals are not permitted; use an 0o prefix for octal integers');
          value = isF ? new PyFloat(parseFloat(text)) : Number(text);
        }
        add('NUMBER', value); i = j; continue;
      }
      let op = null;
      for (const o of OPS) if (src.startsWith(o, i)) { op = o; break; }
      if (op) {
        if (op === '(' || op === '[' || op === '{') brackets.push({ ch: op, line });
        else if (CLOSE_OF[op]) {
          if (!brackets.length) throw syntax(`unmatched '${op}'`);
          const top = brackets.pop();
          if (top.ch !== CLOSE_OF[op]) {
            throw syntax(top.line !== line
              ? `closing parenthesis '${op}' does not match opening parenthesis '${top.ch}' on line ${top.line}`
              : `closing parenthesis '${op}' does not match opening parenthesis '${top.ch}'`);
          }
        }
        add('OP', op); i += op.length; continue;
      }
      const cp = src.codePointAt(i);
      if (cp > 127) throw syntax(`invalid character '${String.fromCodePoint(cp)}' (U+${cp.toString(16).toUpperCase().padStart(4, '0')})`);
      throw syntax('invalid syntax');
    }
    if (brackets.length) { const b = brackets[brackets.length - 1]; throw new PyError('SyntaxError', `'${b.ch}' was never closed`, b.line); }
    const last = toks[toks.length - 1];
    if (last && last.type !== 'NEWLINE' && last.type !== 'DEDENT' && last.type !== 'INDENT') add('NEWLINE', null);
    while (indents.length > 1) { indents.pop(); add('DEDENT', 0); }
    add('EOF', null);
    return toks;
  }

  // ------------------------------------------------------------------ parser
  class Parser {
    constructor(toks) { this.toks = toks; this.p = 0; this.loop = 0; this.func = 0; }
    get tok() { return this.toks[this.p]; }
    peek(o) { return this.toks[Math.min(this.p + (o || 1), this.toks.length - 1)]; }
    next() { return this.toks[this.p++]; }
    isOp(v, t) { t = t || this.tok; return t.type === 'OP' && t.value === v; }
    isKw(v, t) { t = t || this.tok; return t.type === 'NAME' && t.value === v; }
    eatOp(v) { if (this.isOp(v)) { this.p++; return true; } return false; }
    eatKw(v) { if (this.isKw(v)) { this.p++; return true; } return false; }
    fail(msg, t) { t = t || this.tok; throw new PyError('SyntaxError', msg || 'invalid syntax', t.line); }
    expectOp(v, msg) { if (!this.eatOp(v)) this.fail(msg); }
    name() { const t = this.tok; if (t.type !== 'NAME' || KEYWORDS.has(t.value)) this.fail(); this.p++; return t.value; }
    startsExpr(t) {
      t = t || this.tok;
      if (t.type === 'NUMBER' || t.type === 'STRING') return true;
      if (t.type === 'NAME') return !KEYWORDS.has(t.value) || ['True', 'False', 'None', 'not', 'lambda'].includes(t.value);
      return t.type === 'OP' && ['(', '[', '{', '-', '+', '~'].includes(t.value);
    }
    atEnd() { return this.tok.type === 'NEWLINE' || this.tok.type === 'EOF' || this.isOp(';'); }

    program() {
      const body = [];
      while (this.tok.type !== 'EOF') {
        if (this.tok.type === 'NEWLINE') { this.p++; continue; }
        body.push(...this.statement());
      }
      return body;
    }
    statement() {
      const t = this.tok;
      if (t.type === 'INDENT') throw new PyError('IndentationError', 'unexpected indent', t.line);
      if (t.type === 'DEDENT') { this.p++; return []; }
      if (t.type === 'NAME') {
        switch (t.value) {
          case 'if': return [this.ifStmt('if')];
          case 'while': return [this.whileStmt()];
          case 'for': return [this.forStmt()];
          case 'def': return [this.defStmt()];
          case 'try': return [this.tryStmt()];
          case 'class': case 'with': case 'async':
            throw new PyError('AppLimit', `'${t.value}' blocks aren't part of these lessons yet, so this practice app can't run them.`, t.line);
          case 'elif': case 'else': case 'except': case 'finally':
            this.fail();
        }
      }
      return this.simpleStatements();
    }
    suite(kind, headerLine) {
      if (!this.isOp(':')) {
        if (this.isOp('=')) this.fail("invalid syntax. Maybe you meant '==' or ':=' instead of '='?");
        this.fail("expected ':'");
      }
      this.p++;
      if (this.tok.type === 'NEWLINE') {
        this.p++;
        if (this.tok.type !== 'INDENT') throw new PyError('IndentationError', `expected an indented block after ${kind} on line ${headerLine}`, this.tok.line);
        this.p++;
        const body = [];
        while (this.tok.type !== 'DEDENT' && this.tok.type !== 'EOF') {
          if (this.tok.type === 'NEWLINE') { this.p++; continue; }
          body.push(...this.statement());
        }
        if (this.tok.type === 'DEDENT') this.p++;
        return body;
      }
      return this.simpleStatements();
    }
    ifStmt(word) {
      const line = this.next().line;
      const test = this.namedTest();
      const body = this.suite(`'${word}' statement`, line);
      let orelse = [];
      if (this.isKw('elif')) orelse = [this.ifStmt('elif')];
      else if (this.isKw('else')) { const l = this.next().line; orelse = this.suite("'else' statement", l); }
      return { type: 'If', test, body, orelse, line };
    }
    namedTest() {
      const e = this.test();
      if (this.isOp(':=')) throw new PyError('AppLimit', "The := operator isn't part of these lessons yet.", this.tok.line);
      return e;
    }
    whileStmt() {
      const line = this.next().line;
      const test = this.namedTest();
      this.loop++; const body = this.suite("'while' statement", line); this.loop--;
      let orelse = null;
      if (this.isKw('else')) { const l = this.next().line; orelse = this.suite("'else' statement", l); }
      return { type: 'While', test, body, orelse, line };
    }
    forStmt() {
      const line = this.next().line;
      const target = this.targetList();
      if (!this.eatKw('in')) this.fail();
      const iter = this.testList();
      this.loop++; const body = this.suite("'for' statement", line); this.loop--;
      let orelse = null;
      if (this.isKw('else')) { const l = this.next().line; orelse = this.suite("'else' statement", l); }
      return { type: 'For', target, iter, body, orelse, line };
    }
    targetList() {
      const line = this.tok.line;
      const first = this.bitOr();
      let t = first;
      if (this.isOp(',')) {
        const items = [first];
        while (this.eatOp(',')) { if (this.isKw('in') || this.isOp('=')) break; items.push(this.bitOr()); }
        t = { type: 'Tuple', items, line };
      }
      this.checkTarget(t, false);
      return t;
    }
    params(closer) {
      const params = [];
      let sawDefault = false;
      while (!this.isOp(closer)) {
        if (this.isOp('*') || this.isOp('**') || this.isOp('/')) throw new PyError('AppLimit', "*args, **kwargs and / in function definitions aren't part of these lessons yet.", this.tok.line);
        const t = this.tok;
        const name = this.name();
        if (params.some((p) => p.name === name)) this.fail(`duplicate argument '${name}' in function definition`, t);
        if (closer === ')' && this.eatOp(':')) this.test();
        let def = null;
        if (this.eatOp('=')) { def = this.test(); sawDefault = true; }
        else if (sawDefault) this.fail('parameter without a default follows parameter with a default', t);
        params.push({ name, default: def });
        if (!this.eatOp(',')) break;
      }
      return params;
    }
    defStmt() {
      const line = this.next().line;
      const name = this.name();
      this.expectOp('(', "expected '('");
      const params = this.params(')');
      this.expectOp(')');
      if (this.eatOp('->')) this.test();
      const savedLoop = this.loop; this.loop = 0; this.func++;
      const body = this.suite('function definition', line);
      this.loop = savedLoop; this.func--;
      const { locals, globalsDecl } = analyze(body, params.map((p) => p.name));
      return { type: 'FunctionDef', name, params, body, locals, globalsDecl, line };
    }
    tryStmt() {
      const line = this.next().line;
      const body = this.suite("'try' statement", line);
      const handlers = [];
      while (this.isKw('except')) {
        const l = this.next().line;
        let type = null, name = null;
        if (!this.isOp(':')) { type = this.test(); if (this.eatKw('as')) name = this.name(); }
        handlers.push({ type, name, body: this.suite("'except' statement", l), line: l });
      }
      let orelse = null, finalbody = null;
      if (this.isKw('else')) { const l = this.next().line; orelse = this.suite("'else' statement", l); }
      if (this.isKw('finally')) { const l = this.next().line; finalbody = this.suite("'finally' statement", l); }
      if (!handlers.length && !finalbody) this.fail("expected 'except' or 'finally' block");
      return { type: 'Try', body, handlers, orelse, finalbody, line };
    }
    simpleStatements() {
      const out = [this.small()];
      while (this.eatOp(';')) { if (this.tok.type === 'NEWLINE' || this.tok.type === 'EOF') break; out.push(this.small()); }
      if (this.tok.type === 'NEWLINE') this.p++;
      else if (this.tok.type !== 'EOF') {
        const last = out[out.length - 1];
        const t = this.tok;
        if (last.type === 'Expr' && last.value.type === 'Name' && last.value.id === 'print' && (t.type === 'STRING' || t.type === 'NAME' || t.type === 'NUMBER')) {
          this.fail("Missing parentheses in call to 'print'. Did you mean print(...)?", t);
        }
        this.fail();
      }
      return out;
    }
    small() {
      const t = this.tok, line = t.line;
      if (t.type === 'NAME') {
        switch (t.value) {
          case 'pass': this.p++; return { type: 'Pass', line };
          case 'break': this.p++; if (!this.loop) this.fail("'break' outside loop", t); return { type: 'Break', line };
          case 'continue': this.p++; if (!this.loop) this.fail("'continue' not properly in loop", t); return { type: 'Continue', line };
          case 'return': this.p++; if (!this.func) this.fail("'return' outside function", t); return { type: 'Return', value: this.atEnd() ? null : this.testList(), line };
          case 'global': { this.p++; const names = [this.name()]; while (this.eatOp(',')) names.push(this.name()); return { type: 'Global', names, line }; }
          case 'nonlocal': case 'yield': case 'await':
            throw new PyError('AppLimit', `'${t.value}' isn't part of these lessons yet.`, line);
          case 'del': { this.p++; const target = this.testList(); const targets = target.type === 'Tuple' ? target.items : [target]; targets.forEach((x) => this.checkTarget(x, false, 'delete')); return { type: 'Del', targets, line }; }
          case 'import': {
            this.p++; const names = [];
            do { const nm = this.dotted(); let as = null; if (this.eatKw('as')) as = this.name(); names.push({ name: nm, as }); } while (this.eatOp(','));
            return { type: 'Import', names, line };
          }
          case 'from': {
            this.p++; const mod = this.dotted();
            if (!this.eatKw('import')) this.fail();
            const names = [];
            if (this.isOp('*')) throw new PyError('AppLimit', "'from ... import *' isn't supported in this practice app.", line);
            const paren = this.eatOp('(');
            do { if (paren && this.isOp(')')) break; const nm = this.name(); let as = null; if (this.eatKw('as')) as = this.name(); names.push({ name: nm, as }); } while (this.eatOp(','));
            if (paren) this.expectOp(')');
            return { type: 'ImportFrom', module: mod, names, line };
          }
          case 'raise': { this.p++; return { type: 'Raise', exc: this.atEnd() ? null : this.test(), line }; }
          case 'assert': { this.p++; const test = this.test(); const msg = this.eatOp(',') ? this.test() : null; return { type: 'Assert', test, msg, line }; }
        }
      }
      const first = this.testList();
      if (this.isOp('=')) {
        const targets = [first];
        while (this.eatOp('=')) targets.push(this.testList());
        const value = targets.pop();
        targets.forEach((x) => this.checkTarget(x, false));
        return { type: 'Assign', targets, value, line };
      }
      const t2 = this.tok;
      if (t2.type === 'OP' && /^(\+|-|\*|\/|\/\/|%|\*\*|&|\||\^|<<|>>)=$/.test(t2.value)) {
        this.checkTarget(first, true);
        this.p++;
        return { type: 'AugAssign', target: first, op: t2.value.slice(0, -1), value: this.testList(), line };
      }
      if (this.isOp(':') && first.type === 'Name') {
        this.p++; this.test();
        if (this.eatOp('=')) return { type: 'Assign', targets: [first], value: this.testList(), line };
        return { type: 'Pass', line };
      }
      return { type: 'Expr', value: first, line };
    }
    dotted() { let nm = this.name(); while (this.eatOp('.')) nm += '.' + this.name(); return nm; }
    checkTarget(node, aug, verb) {
      const v = verb || 'assign to';
      const say = (what, hint) => this.fail(aug ? `'${what}' is an illegal expression for augmented assignment` : `cannot ${v} ${what}${hint && v === 'assign to' ? " here. Maybe you meant '==' instead of '='?" : ''}`, node);
      switch (node.type) {
        case 'Name': case 'Subscript': case 'Attribute': return;
        case 'Tuple': case 'List':
          if (aug) this.fail(`'${node.type === 'Tuple' ? 'tuple' : 'list'}' is an illegal expression for augmented assignment`, node);
          node.items.forEach((x) => this.checkTarget(x, false, verb)); return;
        case 'Const':
          if (node.value === true || node.value === false || node.value === null) this.fail(`cannot ${v} ${pyRepr(node.value)}`, node);
          return say('literal', true);
        case 'Call': return say('function call', true);
        case 'FStr': return say('f-string expression', true);
        case 'Compare': return say('comparison', false);
        case 'Lambda': return say('lambda', false);
        case 'IfExp': return say('conditional expression', false);
        case 'Dict': return say('dict literal', true);
        case 'ListComp': return say('list comprehension', false);
        default: return say('expression', true);
      }
    }
    testList() {
      const line = this.tok.line;
      const first = this.test();
      if (!this.isOp(',')) return first;
      const items = [first];
      while (this.eatOp(',')) { if (!this.startsExpr()) break; items.push(this.test()); }
      return { type: 'Tuple', items, line };
    }
    test() {
      if (this.isKw('lambda')) return this.lambda();
      const line = this.tok.line;
      const body = this.orTest();
      if (this.isKw('if')) {
        this.p++;
        const cond = this.orTest();
        if (!this.eatKw('else')) this.fail("expected 'else' after 'if' expression");
        return { type: 'IfExp', test: cond, body, orelse: this.test(), line };
      }
      return body;
    }
    lambda() {
      const line = this.next().line;
      const params = this.params(':');
      this.expectOp(':');
      const savedF = this.func; this.func = 1;
      const body = this.test();
      this.func = savedF;
      const locals = new Set(params.map((p) => p.name));
      return { type: 'Lambda', params, body, locals, line };
    }
    orTest() {
      const line = this.tok.line;
      const first = this.andTest();
      if (!this.isKw('or')) return first;
      const values = [first];
      while (this.eatKw('or')) values.push(this.andTest());
      return { type: 'BoolOp', op: 'or', values, line };
    }
    andTest() {
      const line = this.tok.line;
      const first = this.notTest();
      if (!this.isKw('and')) return first;
      const values = [first];
      while (this.eatKw('and')) values.push(this.notTest());
      return { type: 'BoolOp', op: 'and', values, line };
    }
    notTest() {
      if (this.isKw('not')) { const line = this.next().line; return { type: 'Not', operand: this.notTest(), line }; }
      return this.comparison();
    }
    comparison() {
      const line = this.tok.line;
      const left = this.bitOr();
      const ops = [], comps = [];
      for (;;) {
        const t = this.tok;
        let op = null;
        if (t.type === 'OP' && ['<', '>', '==', '>=', '<=', '!='].includes(t.value)) { op = t.value; this.p++; }
        else if (this.isKw('in')) { op = 'in'; this.p++; }
        else if (this.isKw('not') && this.isKw('in', this.peek())) { op = 'not in'; this.p += 2; }
        else if (this.isKw('is')) { this.p++; op = this.eatKw('not') ? 'is not' : 'is'; }
        else break;
        ops.push(op); comps.push(this.bitOr());
      }
      return ops.length ? { type: 'Compare', left, ops, comps, line } : left;
    }
    binLevel(next, ops) {
      let left = next();
      while (this.tok.type === 'OP' && ops.includes(this.tok.value)) {
        const t = this.next();
        left = { type: 'BinOp', op: t.value, left, right: next(), line: t.line };
      }
      return left;
    }
    bitOr() { return this.binLevel(() => this.bitXor(), ['|']); }
    bitXor() { return this.binLevel(() => this.bitAnd(), ['^']); }
    bitAnd() { return this.binLevel(() => this.shift(), ['&']); }
    shift() { return this.binLevel(() => this.arith(), ['<<', '>>']); }
    arith() { return this.binLevel(() => this.term(), ['+', '-']); }
    term() { return this.binLevel(() => this.factor(), ['*', '/', '//', '%', '@']); }
    factor() {
      if (this.isOp('-') || this.isOp('+') || this.isOp('~')) {
        const t = this.next();
        return { type: 'Unary', op: t.value, operand: this.factor(), line: t.line };
      }
      return this.power();
    }
    power() {
      const base = this.atomExpr();
      if (this.isOp('**')) { const t = this.next(); return { type: 'BinOp', op: '**', left: base, right: this.factor(), line: t.line }; }
      return base;
    }
    atomExpr() {
      let node = this.atom();
      for (;;) {
        const t = this.tok;
        if (this.isOp('(')) { this.p++; node = this.call(node, t.line); }
        else if (this.isOp('[')) {
          this.p++;
          node = { type: 'Subscript', value: node, index: this.subscript(), line: t.line };
          if (!this.eatOp(']')) { if (this.startsExpr()) this.fail('invalid syntax. Perhaps you forgot a comma?'); this.fail(); }
        } else if (this.isOp('.')) {
          this.p++;
          const nt = this.tok;
          if (nt.type !== 'NAME') this.fail('invalid syntax', nt);
          this.p++;
          node = { type: 'Attribute', value: node, attr: nt.value, line: t.line };
        } else break;
      }
      return node;
    }
    call(func, line) {
      const args = [], kwargs = [];
      if (this.eatOp(')')) return { type: 'Call', func, args, kwargs, line };
      for (;;) {
        if (this.isOp('*') || this.isOp('**')) throw new PyError('AppLimit', "Unpacking with * or ** in a call isn't part of these lessons yet.", this.tok.line);
        const t = this.tok;
        if (t.type === 'NAME' && !KEYWORDS.has(t.value) && this.isOp('=', this.peek())) {
          this.p += 2;
          if (kwargs.some((k) => k.name === t.value)) this.fail(`keyword argument repeated: ${t.value}`, t);
          kwargs.push({ name: t.value, value: this.test() });
        } else {
          let a = this.test();
          if (this.isKw('for')) {
            a = this.comprehension('ListComp', a, t.line);
            if (args.length || kwargs.length || !this.isOp(')')) this.fail('Generator expression must be parenthesized', t);
          }
          if (kwargs.length) this.fail('positional argument follows keyword argument', t);
          args.push(a);
        }
        if (this.eatOp(')')) break;
        if (this.eatOp(',')) { if (this.eatOp(')')) break; continue; }
        if (this.isOp('=')) this.fail('expression cannot contain assignment, perhaps you meant "=="?');
        if (this.startsExpr()) this.fail('invalid syntax. Perhaps you forgot a comma?');
        this.fail();
      }
      return { type: 'Call', func, args, kwargs, line };
    }
    subscript() {
      const line = this.tok.line;
      let lower = null, upper = null, step = null;
      if (!this.isOp(':')) {
        lower = this.test();
        if (!this.isOp(':')) {
          if (this.isOp(',')) { const items = [lower]; while (this.eatOp(',')) { if (this.isOp(']')) break; items.push(this.test()); } return { type: 'Tuple', items, line }; }
          return lower;
        }
      }
      this.expectOp(':');
      if (!this.isOp(']') && !this.isOp(':')) upper = this.test();
      if (this.eatOp(':') && !this.isOp(']')) step = this.test();
      return { type: 'Slice', lower, upper, step, line };
    }
    comprehension(kind, elt, line, valueNode) {
      const gens = [];
      while (this.isKw('for')) {
        this.p++;
        const target = this.targetList();
        if (!this.eatKw('in')) this.fail();
        const iter = this.orTest();
        const ifs = [];
        while (this.isKw('if')) { this.p++; ifs.push(this.orTest()); }
        gens.push({ target, iter, ifs });
      }
      return { type: kind, elt, value: valueNode, gens, line };
    }
    atom() {
      const t = this.tok, line = t.line;
      if (t.type === 'NUMBER') { this.p++; return { type: 'Const', value: t.value, line }; }
      if (t.type === 'STRING') return this.strings();
      if (t.type === 'NAME') {
        if (t.value === 'True') { this.p++; return { type: 'Const', value: true, line }; }
        if (t.value === 'False') { this.p++; return { type: 'Const', value: false, line }; }
        if (t.value === 'None') { this.p++; return { type: 'Const', value: null, line }; }
        if (KEYWORDS.has(t.value)) this.fail();
        this.p++;
        return { type: 'Name', id: t.value, line };
      }
      if (t.type === 'OP') {
        if (t.value === '(') {
          this.p++;
          if (this.eatOp(')')) return { type: 'Tuple', items: [], line };
          const first = this.test();
          if (this.isKw('for')) { const g = this.comprehension('ListComp', first, line); this.expectOp(')'); return g; }
          if (this.eatOp(')')) return first;
          if (this.isOp(',')) {
            const items = [first];
            while (this.eatOp(',')) { if (this.isOp(')')) break; items.push(this.test()); }
            if (!this.eatOp(')')) { if (this.startsExpr()) this.fail('invalid syntax. Perhaps you forgot a comma?'); this.fail(); }
            return { type: 'Tuple', items, line };
          }
          if (this.isOp('=')) this.fail("invalid syntax. Maybe you meant '==' or ':=' instead of '='?");
          if (this.startsExpr()) this.fail('invalid syntax. Perhaps you forgot a comma?');
          this.fail();
        }
        if (t.value === '[') {
          this.p++;
          if (this.eatOp(']')) return { type: 'List', items: [], line };
          const first = this.test();
          if (this.isKw('for')) { const c = this.comprehension('ListComp', first, line); this.expectOp(']'); return c; }
          const items = [first];
          while (this.eatOp(',')) { if (this.isOp(']')) break; items.push(this.test()); }
          if (!this.eatOp(']')) { if (this.startsExpr()) this.fail('invalid syntax. Perhaps you forgot a comma?'); this.fail(); }
          return { type: 'List', items, line };
        }
        if (t.value === '{') {
          this.p++;
          if (this.eatOp('}')) return { type: 'Dict', keys: [], values: [], line };
          if (this.isOp('**')) throw new PyError('AppLimit', "Unpacking with ** isn't part of these lessons yet.", line);
          const k = this.test();
          if (this.eatOp(':')) {
            const v = this.test();
            if (this.isKw('for')) { const c = this.comprehension('DictComp', k, line, v); this.expectOp('}'); return c; }
            const keys = [k], values = [v];
            while (this.eatOp(',')) {
              if (this.isOp('}')) break;
              keys.push(this.test());
              this.expectOp(':', "':' expected after dictionary key");
              values.push(this.test());
            }
            if (!this.eatOp('}')) { if (this.startsExpr()) this.fail('invalid syntax. Perhaps you forgot a comma?'); this.fail(); }
            return { type: 'Dict', keys, values, line };
          }
          if (this.startsExpr()) this.fail('invalid syntax. Perhaps you forgot a comma?');
          throw new PyError('AppLimit', "Sets like {1, 2, 3} aren't part of these lessons yet.", line);
        }
        if (t.value === '...') { this.p++; return { type: 'Const', value: null, line }; }
      }
      this.fail();
    }
    strings() {
      const line = this.tok.line;
      const parts = [];
      let isF = false;
      while (this.tok.type === 'STRING') {
        const t = this.next();
        if (t.f) { isF = true; parts.push(...fparts(t.value, t.raw, t.line)); }
        else parts.push({ s: t.raw ? t.value : decodeEscapes(t.value) });
      }
      if (!isF) return { type: 'Const', value: parts.map((x) => x.s).join(''), line };
      return { type: 'FStr', parts, line };
    }
  }

  function parseSubExpr(text, line) {
    const toks = tokenize('(' + text + '\n)', line - 1);
    const p = new Parser(toks);
    p.func = 1;
    const e = p.test();
    if (p.tok.type !== 'NEWLINE' && p.tok.type !== 'EOF') p.fail();
    return e;
  }
  function fparts(raw, isRaw, line, inSpec) {
    const parts = [];
    let buf = '';
    const flush = () => { if (buf) { parts.push({ s: isRaw ? buf : decodeEscapes(buf) }); buf = ''; } };
    let k = 0;
    while (k < raw.length) {
      const ch = raw[k];
      if (ch === '{') {
        if (!inSpec && raw[k + 1] === '{') { buf += '{'; k += 2; continue; }
        let depth = 0, j = k + 1, q = null, split = -1, conv = -1;
        for (; j < raw.length; j++) {
          const c = raw[j];
          if (q) { if (c === q) q = null; continue; }
          if (c === "'" || c === '"') { q = c; continue; }
          if (c === '(' || c === '[' || c === '{') depth++;
          else if (c === ')' || c === ']' || (c === '}' && depth > 0)) depth--;
          else if (c === '}' && depth === 0) break;
          else if (depth === 0 && split < 0 && c === '!' && raw[j + 1] !== '=') { conv = j; }
          else if (depth === 0 && split < 0 && c === ':') { split = j; }
        }
        if (j >= raw.length) throw new PyError('SyntaxError', "f-string: expecting '}'", line);
        let exprEnd = split >= 0 ? split : j;
        let convChar = null;
        if (conv >= 0 && conv < exprEnd) { convChar = raw.slice(conv + 1, exprEnd).trim(); exprEnd = conv; if (!/^[rsa]$/.test(convChar)) throw new PyError('SyntaxError', "f-string: invalid conversion character: expected 's', 'r', or 'a'", line); }
        let exprText = raw.slice(k + 1, exprEnd);
        const specText = split >= 0 ? raw.slice(split + 1, j) : '';
        let debug = null;
        const trimmed = exprText.replace(/\s+$/, '');
        if (/[^=!<>]=$/.test(trimmed) || trimmed === '=') { debug = exprText; exprText = trimmed.slice(0, -1); }
        if (!exprText.trim()) throw new PyError('SyntaxError', "f-string: valid expression required before '}'", line);
        flush();
        parts.push({ expr: parseSubExpr(exprText, line), conv: convChar, spec: specText ? fparts(specText, true, line, true) : null, debug });
        k = j + 1;
      } else if (ch === '}' && !inSpec) {
        if (raw[k + 1] === '}') { buf += '}'; k += 2; continue; }
        throw new PyError('SyntaxError', "f-string: single '}' is not allowed", line);
      } else { buf += ch; k++; }
    }
    flush();
    return parts;
  }

  function analyze(body, params) {
    const locals = new Set(params), globalsDecl = new Set();
    const tnames = (t) => {
      if (!t) return;
      if (t.type === 'Name') locals.add(t.id);
      else if (t.type === 'Tuple' || t.type === 'List') t.items.forEach(tnames);
    };
    const walk = (stmts) => {
      for (const s of stmts || []) {
        switch (s.type) {
          case 'Assign': s.targets.forEach(tnames); break;
          case 'AugAssign': tnames(s.target); break;
          case 'For': tnames(s.target); walk(s.body); walk(s.orelse); break;
          case 'While': walk(s.body); walk(s.orelse); break;
          case 'If': walk(s.body); walk(s.orelse); break;
          case 'Try': walk(s.body); s.handlers.forEach((h) => { if (h.name) locals.add(h.name); walk(h.body); }); walk(s.orelse); walk(s.finalbody); break;
          case 'FunctionDef': locals.add(s.name); break;
          case 'Import': s.names.forEach((x) => locals.add(x.as || x.name.split('.')[0])); break;
          case 'ImportFrom': s.names.forEach((x) => locals.add(x.as || x.name)); break;
          case 'Global': s.names.forEach((x) => globalsDecl.add(x)); break;
          case 'Del': s.targets.forEach(tnames); break;
        }
      }
    };
    walk(body);
    for (const g of globalsDecl) locals.delete(g);
    return { locals, globalsDecl };
  }

  function parse(src) { return new Parser(tokenize(src)).program(); }

  // ------------------------------------------------------------------ built-ins
  const BUILTINS = new Map();
  const TYPES = Object.create(null);
  const def = (name, fn, isType) => { const b = new PyBuiltin(name, fn, isType); BUILTINS.set(name, b); if (isType) TYPES[name] = b; return b; };
  const noKw = (name, kw) => { const k = Object.keys(kw); if (k.length) throw TE(`${name}() takes no keyword arguments`); };
  const kwOnly = (name, kw, allowed) => { for (const k of Object.keys(kw)) if (!allowed.includes(k)) throw TE(`${name}() got an unexpected keyword argument '${k}'`); };
  const exactly = (name, args, n) => {
    if (args.length !== n) {
      if (n === 1) throw TE(`${name}() takes exactly one argument (${args.length} given)`);
      throw TE(`${name} expected ${n} arguments, got ${args.length}`);
    }
  };
  const between = (name, args, lo, hi) => {
    if (args.length < lo) throw TE(`${name} expected at least ${lo} argument${lo === 1 ? '' : 's'}, got ${args.length}`);
    if (args.length > hi) throw TE(`${name} expected at most ${hi} argument${hi === 1 ? '' : 's'}, got ${args.length}`);
  };
  const toIndex = (v) => { if (!isInt(v)) throw TE(`'${typeName(v)}' object cannot be interpreted as an integer`); return num(v); };
  function typeOf(v) {
    const n = v instanceof PyExc ? null : typeName(v);
    if (v instanceof PyExc) return v.cls;
    if (!TYPES[n]) TYPES[n] = new PyBuiltin(n, null, true);
    return TYPES[n];
  }

  def('print', (args, kw, ip) => {
    kwOnly('print', kw, ['sep', 'end', 'file', 'flush']);
    for (const k of ['sep', 'end']) if (kw[k] !== undefined && kw[k] !== null && typeof kw[k] !== 'string') throw TE(`${k} must be None or a string, not ${typeName(kw[k])}`);
    const sep = kw.sep == null ? ' ' : kw.sep, end = kw.end == null ? '\n' : kw.end;
    ip.write(args.map(pyStr).join(sep) + end);
    return null;
  });
  def('len', (args, kw) => { noKw('len', kw); exactly('len', args, 1); return pyLen(args[0]); });
  def('str', (args, kw) => { noKw('str', kw); if (args.length > 1) throw TE('str() argument \'encoding\' must be str, not ' + typeName(args[1])); return args.length ? pyStr(args[0]) : ''; }, true);
  def('repr', (args, kw) => { noKw('repr', kw); exactly('repr', args, 1); return pyRepr(args[0]); });
  def('int', (args, kw) => {
    kwOnly('int', kw, ['base']);
    if (!args.length) return 0;
    const x = args[0];
    const base = args.length > 1 ? toIndex(args[1]) : kw.base !== undefined ? toIndex(kw.base) : null;
    if (typeof x === 'string') {
      const s = x.trim().replace(/_/g, '');
      const b = base === null ? 10 : base;
      const digits = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, b);
      const re = new RegExp('^[+-]?[' + digits + ']+$', 'i');
      if (!re.test(s) || /^[+-]?_|__|_$/.test(x.trim())) throw VE(`invalid literal for int() with base ${b}: ${strRepr(x)}`);
      return parseInt(s, b);
    }
    if (base !== null) throw TE("int() can't convert non-string with explicit base");
    if (typeof x === 'boolean') return x ? 1 : 0;
    if (typeof x === 'number') return x;
    if (x instanceof PyFloat) {
      if (Number.isNaN(x.v)) throw VE('cannot convert float NaN to integer');
      if (!Number.isFinite(x.v)) throw new PyError('OverflowError', 'cannot convert float infinity to integer');
      return Math.trunc(x.v) || 0;
    }
    throw TE(`int() argument must be a string, a bytes-like object or a real number, not '${typeName(x)}'`);
  }, true);
  def('float', (args, kw) => {
    noKw('float', kw);
    if (!args.length) return new PyFloat(0);
    const x = args[0];
    if (typeof x === 'string') {
      const s = x.trim().replace(/(\d)_(?=\d)/g, '$1');
      if (/^[+-]?(inf|infinity)$/i.test(s)) return new PyFloat(s[0] === '-' ? -Infinity : Infinity);
      if (/^[+-]?nan$/i.test(s)) return new PyFloat(NaN);
      if (!/^[+-]?((\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)$/.test(s)) throw VE(`could not convert string to float: ${strRepr(x)}`);
      return new PyFloat(parseFloat(s));
    }
    if (isNum(x)) return new PyFloat(num(x));
    throw TE(`float() argument must be a string or a real number, not '${typeName(x)}'`);
  }, true);
  def('bool', (args, kw) => { noKw('bool', kw); return args.length ? truthy(args[0]) : false; }, true);
  def('list', (args, kw) => { noKw('list', kw); between('list', args, 0, 1); return args.length ? toList(args[0]) : []; }, true);
  def('tuple', (args, kw) => { noKw('tuple', kw); between('tuple', args, 0, 1); return new PyTuple(args.length ? toList(args[0]) : []); }, true);
  def('dict', (args, kw) => {
    const d = new PyDict();
    if (args.length > 1) throw TE(`dict expected at most 1 argument, got ${args.length}`);
    if (args.length) {
      const src = args[0];
      if (src instanceof PyDict) for (const [k, v] of src.entries()) d.set(k, v);
      else for (const item of toList(src)) { const pair = toList(item); if (pair.length !== 2) throw VE(`dictionary update sequence element #0 has length ${pair.length}; 2 is required`); d.set(pair[0], pair[1]); }
    }
    for (const k of Object.keys(kw)) d.set(k, kw[k]);
    return d;
  }, true);
  def('range', (args, kw) => {
    noKw('range', kw);
    if (!args.length) throw TE('range expected at least 1 argument, got 0');
    if (args.length > 3) throw TE(`range expected at most 3 arguments, got ${args.length}`);
    const v = args.map(toIndex);
    const [start, stop, step] = v.length === 1 ? [0, v[0], 1] : [v[0], v[1], v.length === 3 ? v[2] : 1];
    if (step === 0) throw VE('range() arg 3 must not be zero');
    return new PyRange(start, stop, step);
  }, true);
  def('type', (args, kw) => { noKw('type', kw); if (args.length !== 1) throw TE('type() takes 1 or 3 arguments'); return typeOf(args[0]); }, true);
  def('isinstance', (args, kw) => {
    noKw('isinstance', kw); exactly('isinstance', args, 2);
    const [obj, cls] = args;
    const check = (c) => {
      if (c instanceof PyExcType) return obj instanceof PyExc && isSub(obj.cls, c);
      if (c instanceof PyBuiltin && c.isType) return typeName(obj) === c.name || (c.name === 'int' && typeof obj === 'boolean');
      throw TE('isinstance() arg 2 must be a type, a tuple of types, or a union');
    };
    return cls instanceof PyTuple ? cls.items.some(check) : check(cls);
  });
  def('abs', (args, kw) => { noKw('abs', kw); exactly('abs', args, 1); const x = args[0]; if (!isNum(x)) throw TE(`bad operand type for abs(): '${typeName(x)}'`); return mk(Math.abs(num(x)), x instanceof PyFloat); });
  def('round', (args, kw) => {
    kwOnly('round', kw, ['ndigits']);
    if (!args.length) throw TE("round() missing required argument 'number' (pos 1)");
    if (args.length > 2) throw TE(`round() takes at most 2 arguments (${args.length} given)`);
    return roundNum(args[0], args.length > 1 ? args[1] : kw.ndigits);
  });
  function minmax(name, args, kw, ip, sign) {
    kwOnly(name, kw, ['key', 'default']);
    if (!args.length) throw TE(`${name} expected at least 1 argument, got 0`);
    const items = args.length === 1 ? toList(args[0]) : args;
    if (!items.length) { if (kw.default !== undefined) return kw.default; throw VE(`${name}() iterable argument is empty`); }
    const key = kw.key && kw.key !== null ? (x) => ip.callValue(kw.key, [x], {}) : (x) => x;
    let best = items[0], bk = key(best);
    for (let i = 1; i < items.length; i++) { const k = key(items[i]); if (order(k, bk, sign > 0 ? '>' : '<') * sign > 0) { best = items[i]; bk = k; } }
    return best;
  }
  def('min', (args, kw, ip) => minmax('min', args, kw, ip, -1));
  def('max', (args, kw, ip) => minmax('max', args, kw, ip, 1));
  def('sum', (args, kw) => {
    kwOnly('sum', kw, ['start']);
    between('sum', args, 1, 2);
    let total = args.length > 1 ? args[1] : kw.start !== undefined ? kw.start : 0;
    if (typeof total === 'string') throw TE("sum() can't sum strings [use ''.join(seq) instead]");
    for (const x of iterate(args[0])) total = binop('+', total, x);
    return total;
  });
  function sortList(arr, kw, ip, name) {
    kwOnly(name, kw, ['key', 'reverse']);
    const key = kw.key && kw.key !== null ? (x) => ip.callValue(kw.key, [x], {}) : (x) => x;
    const rev = kw.reverse !== undefined && truthy(kw.reverse);
    const dec = arr.map((x) => [key(x), x]);
    dec.sort((a, b) => (rev ? order(b[0], a[0], '<') : order(a[0], b[0], '<')));
    return dec.map((p) => p[1]);
  }
  def('sorted', (args, kw, ip) => { if (args.length !== 1) throw TE(`sorted expected 1 argument, got ${args.length}`); return sortList(toList(args[0]), kw, ip, 'sorted'); });
  def('reversed', (args, kw) => { noKw('reversed', kw); exactly('reversed', args, 1); if (args[0] instanceof PyDict) return args[0].keys().reverse(); if (!(isSeq(args[0]) || args[0] instanceof PyRange)) throw TE(`'${typeName(args[0])}' object is not reversible`); return toList(args[0]).reverse(); });
  def('enumerate', (args, kw) => { kwOnly('enumerate', kw, ['start']); between('enumerate', args, 1, 2); let i = args.length > 1 ? toIndex(args[1]) : kw.start !== undefined ? toIndex(kw.start) : 0; return toList(args[0]).map((x) => new PyTuple([i++, x])); });
  def('zip', (args, kw) => { kwOnly('zip', kw, ['strict']); const lists = args.map(toList); if (!lists.length) return []; const n = Math.min(...lists.map((l) => l.length)); const out = []; for (let i = 0; i < n; i++) out.push(new PyTuple(lists.map((l) => l[i]))); return out; });
  def('any', (args, kw) => { noKw('any', kw); exactly('any', args, 1); for (const x of iterate(args[0])) if (truthy(x)) return true; return false; });
  def('all', (args, kw) => { noKw('all', kw); exactly('all', args, 1); for (const x of iterate(args[0])) if (!truthy(x)) return false; return true; });
  def('map', (args, kw, ip) => { noKw('map', kw); if (args.length < 2) throw TE('map() must have at least two arguments.'); const lists = args.slice(1).map(toList); const n = Math.min(...lists.map((l) => l.length)); const out = []; for (let i = 0; i < n; i++) out.push(ip.callValue(args[0], lists.map((l) => l[i]), {})); return out; });
  def('filter', (args, kw, ip) => { noKw('filter', kw); exactly('filter', args, 2); return toList(args[1]).filter((x) => truthy(args[0] === null ? x : ip.callValue(args[0], [x], {}))); });
  def('chr', (args, kw) => { noKw('chr', kw); exactly('chr', args, 1); return String.fromCodePoint(toIndex(args[0])); });
  def('ord', (args, kw) => { noKw('ord', kw); exactly('ord', args, 1); const s = args[0]; if (typeof s !== 'string') throw TE(`ord() expected string of length 1, but ${typeName(s)} found`); const a = Array.from(s); if (a.length !== 1) throw TE(`ord() expected a character, but string of length ${a.length} found`); return a[0].codePointAt(0); });
  def('divmod', (args, kw) => { noKw('divmod', kw); exactly('divmod', args, 2); return new PyTuple([binop('//', args[0], args[1]), binop('%', args[0], args[1])]); });
  def('pow', (args, kw) => { noKw('pow', kw); between('pow', args, 2, 3); const r = binop('**', args[0], args[1]); return args.length === 3 ? binop('%', r, args[2]) : r; });
  def('format', (args, kw) => { noKw('format', kw); between('format', args, 1, 2); return formatSpec(args[0], args.length > 1 ? args[1] : ''); });
  def('hex', (args) => { const n = toIndex(args[0]); return (n < 0 ? '-0x' : '0x') + Math.abs(n).toString(16); });
  def('bin', (args) => { const n = toIndex(args[0]); return (n < 0 ? '-0b' : '0b') + Math.abs(n).toString(2); });
  def('oct', (args) => { const n = toIndex(args[0]); return (n < 0 ? '-0o' : '0o') + Math.abs(n).toString(8); });
  def('callable', (args) => args[0] instanceof PyFunction || args[0] instanceof PyBuiltin || args[0] instanceof PyBound || args[0] instanceof PyExcType);
  def('input', () => { throw LIMIT("input() waits for someone to type while the program runs. This practice app can't do that yet, so put the value in a variable instead, for example: stock = 120"); });
  def('open', () => { throw LIMIT("open() reads files from a computer. This practice app runs on your phone without files, so it can't open them."); });
  for (const nm of ['help', 'exit', 'quit', 'eval', 'exec', 'compile', 'globals', 'locals', 'vars', 'dir', 'getattr', 'setattr', 'hasattr', 'delattr', 'id', 'hash', 'iter', 'next', 'object', 'super', 'set', 'frozenset', 'bytes', 'bytearray', 'complex', 'slice', 'memoryview', 'property', 'classmethod', 'staticmethod', 'breakpoint', '__import__', 'ascii', 'issubclass', 'aiter', 'anext']) {
    if (!BUILTINS.has(nm)) def(nm, () => { throw LIMIT(`${nm}() isn't available in this practice app yet.`); });
  }
  for (const n of Object.keys(EXC)) BUILTINS.set(n, EXC[n]);

  // ------------------------------------------------------------------ methods
  const T = 'str';
  const noArgs = (owner, name, args, kw) => { noKw(`${owner}.${name}`, kw); if (args.length) throw TE(`${owner}.${name}() takes no arguments (${args.length} given)`); };
  const oneArg = (owner, name, args, kw) => { noKw(`${owner}.${name}`, kw); if (args.length !== 1) throw TE(`${owner}.${name}() takes exactly one argument (${args.length} given)`); };
  const range2 = (owner, name, args, lo, hi) => {
    if (args.length < lo) throw TE(`${name} expected at least ${lo} argument${lo === 1 ? '' : 's'}, got ${args.length}`);
    if (args.length > hi) throw TE(`${name} expected at most ${hi} argument${hi === 1 ? '' : 's'}, got ${args.length}`);
  };
  const needStr = (fn, i, v) => { if (typeof v !== 'string') throw TE(`${fn}() argument ${i} must be str, not ${typeName(v)}`); return v; };
  const isCased = (ch) => ch.toLowerCase() !== ch.toUpperCase();
  function stripChars(s, chars, left, right) {
    const set = chars === null || chars === undefined ? null : new Set(Array.from(chars));
    const test = (ch) => (set ? set.has(ch) : /\s/.test(ch));
    const a = Array.from(s);
    let i = 0, j = a.length;
    if (left) while (i < j && test(a[i])) i++;
    if (right) while (j > i && test(a[j - 1])) j--;
    return a.slice(i, j).join('');
  }
  function strFormat(s, args, kw) {
    let auto = 0;
    return s.replace(/\{\{|\}\}|\{([^{}!:]*)(?:!([rsa]))?(?::([^{}]*))?\}/g, (all, field, conv, spec) => {
      if (all === '{{') return '{';
      if (all === '}}') return '}';
      let v;
      if (field === '') { if (auto >= args.length) throw new PyError('IndexError', `Replacement index ${auto} out of range for positional args tuple`); v = args[auto++]; }
      else if (/^\d+$/.test(field)) { const i = Number(field); if (i >= args.length) throw new PyError('IndexError', `Replacement index ${i} out of range for positional args tuple`); v = args[i]; }
      else { if (!(field in kw)) { const e = new PyError('KeyError', strRepr(field)); e.keyArg = field; throw e; } v = kw[field]; }
      if (conv === 'r' || conv === 'a') v = pyRepr(v); else if (conv === 's') v = pyStr(v);
      return formatSpec(v, spec || '');
    });
  }
  const STR = {
    upper: (s, a, k) => { noArgs(T, 'upper', a, k); return s.toUpperCase(); },
    lower: (s, a, k) => { noArgs(T, 'lower', a, k); return s.toLowerCase(); },
    casefold: (s, a, k) => { noArgs(T, 'casefold', a, k); return s.toLowerCase(); },
    swapcase: (s, a, k) => { noArgs(T, 'swapcase', a, k); return Array.from(s, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join(''); },
    title: (s, a, k) => {
      noArgs(T, 'title', a, k);
      let prev = false, out = '';
      for (const ch of s) { if (isCased(ch)) { out += prev ? ch.toLowerCase() : ch.toUpperCase(); prev = true; } else { out += ch; prev = false; } }
      return out;
    },
    capitalize: (s, a, k) => { noArgs(T, 'capitalize', a, k); const c = Array.from(s); return c.length ? c[0].toUpperCase() + c.slice(1).join('').toLowerCase() : ''; },
    strip: (s, a, k) => { noKw('str.strip', k); range2(T, 'strip', a, 0, 1); return stripChars(s, a[0], true, true); },
    lstrip: (s, a, k) => { noKw('str.lstrip', k); range2(T, 'lstrip', a, 0, 1); return stripChars(s, a[0], true, false); },
    rstrip: (s, a, k) => { noKw('str.rstrip', k); range2(T, 'rstrip', a, 0, 1); return stripChars(s, a[0], false, true); },
    replace: (s, a, k) => {
      kwOnly('str.replace', k, ['count']);
      range2(T, 'replace', a, 2, 3);
      const old = needStr('replace', 1, a[0]), nw = needStr('replace', 2, a[1]);
      let count = a.length > 2 ? toIndex(a[2]) : k.count !== undefined ? toIndex(k.count) : -1;
      if (count < 0) return s.split(old).join(nw);
      let out = '', rest = s;
      while (count-- > 0) { const i = rest.indexOf(old); if (i < 0) break; out += rest.slice(0, i) + nw; rest = rest.slice(i + old.length); if (!old.length) { out += rest[0] || ''; rest = rest.slice(1); } }
      return out + rest;
    },
    split: (s, a, k) => {
      kwOnly('str.split', k, ['sep', 'maxsplit']);
      range2(T, 'split', a, 0, 2);
      const sep = a.length > 0 ? a[0] : k.sep !== undefined ? k.sep : null;
      let max = a.length > 1 ? toIndex(a[1]) : k.maxsplit !== undefined ? toIndex(k.maxsplit) : -1;
      if (sep === null) {
        const out = []; let rest = s.replace(/^\s+/, '');
        while (rest.length) {
          if (max === 0) { out.push(rest.replace(/\s+$/, '')); break; }
          const m = /\s+/.exec(rest);
          if (!m) { out.push(rest); break; }
          out.push(rest.slice(0, m.index)); rest = rest.slice(m.index + m[0].length); max--;
        }
        return out;
      }
      needStr('split', 1, sep);
      if (!sep.length) throw VE('empty separator');
      if (max < 0) return s.split(sep);
      const out = []; let rest = s;
      while (max-- > 0) { const i = rest.indexOf(sep); if (i < 0) break; out.push(rest.slice(0, i)); rest = rest.slice(i + sep.length); }
      out.push(rest); return out;
    },
    join: (s, a, k) => {
      oneArg(T, 'join', a, k);
      const items = toList(a[0]);
      items.forEach((x, i) => { if (typeof x !== 'string') throw TE(`sequence item ${i}: expected str instance, ${typeName(x)} found`); });
      return items.join(s);
    },
    startswith: (s, a, k) => { noKw('str.startswith', k); range2(T, 'startswith', a, 1, 3); const p = a[0] instanceof PyTuple ? a[0].items : [a[0]]; const sub = s.slice(a[1] !== undefined ? num(a[1]) : 0, a[2] !== undefined ? num(a[2]) : undefined); return p.some((x) => { if (typeof x !== 'string') throw TE(`startswith first arg must be str or a tuple of str, not ${typeName(x)}`); return sub.startsWith(x); }); },
    endswith: (s, a, k) => { noKw('str.endswith', k); range2(T, 'endswith', a, 1, 3); const p = a[0] instanceof PyTuple ? a[0].items : [a[0]]; const sub = s.slice(a[1] !== undefined ? num(a[1]) : 0, a[2] !== undefined ? num(a[2]) : undefined); return p.some((x) => { if (typeof x !== 'string') throw TE(`endswith first arg must be str or a tuple of str, not ${typeName(x)}`); return sub.endsWith(x); }); },
    find: (s, a, k) => { noKw('str.find', k); range2(T, 'find', a, 1, 3); needStr('find', 1, a[0]); return s.indexOf(a[0], a[1] !== undefined ? num(a[1]) : 0); },
    rfind: (s, a, k) => { noKw('str.rfind', k); range2(T, 'rfind', a, 1, 3); needStr('rfind', 1, a[0]); return s.lastIndexOf(a[0]); },
    index: (s, a, k) => { noKw('str.index', k); range2(T, 'index', a, 1, 3); needStr('index', 1, a[0]); const i = s.indexOf(a[0], a[1] !== undefined ? num(a[1]) : 0); if (i < 0) throw VE('substring not found'); return i; },
    count: (s, a, k) => { noKw('str.count', k); range2(T, 'count', a, 1, 3); needStr('count', 1, a[0]); if (!a[0].length) return Array.from(s).length + 1; return s.split(a[0]).length - 1; },
    isdigit: (s, a, k) => { noArgs(T, 'isdigit', a, k); return /^\p{Nd}+$/u.test(s); },
    isdecimal: (s, a, k) => { noArgs(T, 'isdecimal', a, k); return /^\p{Nd}+$/u.test(s); },
    isnumeric: (s, a, k) => { noArgs(T, 'isnumeric', a, k); return /^\p{N}+$/u.test(s); },
    isalpha: (s, a, k) => { noArgs(T, 'isalpha', a, k); return /^\p{L}+$/u.test(s); },
    isalnum: (s, a, k) => { noArgs(T, 'isalnum', a, k); return /^[\p{L}\p{N}]+$/u.test(s); },
    isspace: (s, a, k) => { noArgs(T, 'isspace', a, k); return /^\s+$/.test(s); },
    isupper: (s, a, k) => { noArgs(T, 'isupper', a, k); return /\p{Lu}/u.test(s) && s === s.toUpperCase() && Array.from(s).some(isCased); },
    islower: (s, a, k) => { noArgs(T, 'islower', a, k); return /\p{Ll}/u.test(s) && s === s.toLowerCase(); },
    istitle: (s, a, k) => { noArgs(T, 'istitle', a, k); return Array.from(s).some(isCased) && STR.title(s, [], {}) === s; },
    isascii: (s, a, k) => { noArgs(T, 'isascii', a, k); return /^[\x00-\x7f]*$/.test(s); },
    center: (s, a, k) => { noKw('str.center', k); range2(T, 'center', a, 1, 2); return formatSpec(s, (a[1] || ' ') + '^' + toIndex(a[0])); },
    ljust: (s, a, k) => { noKw('str.ljust', k); range2(T, 'ljust', a, 1, 2); return formatSpec(s, (a[1] || ' ') + '<' + toIndex(a[0])); },
    rjust: (s, a, k) => { noKw('str.rjust', k); range2(T, 'rjust', a, 1, 2); return formatSpec(s, (a[1] || ' ') + '>' + toIndex(a[0])); },
    zfill: (s, a, k) => { oneArg(T, 'zfill', a, k); const w = toIndex(a[0]); const sign = /^[+-]/.test(s) ? s[0] : ''; const body = sign ? s.slice(1) : s; return sign + body.padStart(Math.max(0, w - sign.length), '0'); },
    format: (s, a, k) => strFormat(s, a, k),
    splitlines: (s, a, k) => { noKw('str.splitlines', k); const parts = s.split(/\r\n|\r|\n/); if (parts.length && parts[parts.length - 1] === '') parts.pop(); return parts; },
    removeprefix: (s, a, k) => { oneArg(T, 'removeprefix', a, k); needStr('removeprefix', 1, a[0]); return a[0] && s.startsWith(a[0]) ? s.slice(a[0].length) : s; },
    removesuffix: (s, a, k) => { oneArg(T, 'removesuffix', a, k); needStr('removesuffix', 1, a[0]); return a[0] && s.endsWith(a[0]) ? s.slice(0, -a[0].length) : s; },
    partition: (s, a, k) => { oneArg(T, 'partition', a, k); needStr('partition', 1, a[0]); const i = s.indexOf(a[0]); return i < 0 ? new PyTuple([s, '', '']) : new PyTuple([s.slice(0, i), a[0], s.slice(i + a[0].length)]); },
  };
  const L = 'list';
  const LIST = {
    append: (l, a, k) => { oneArg(L, 'append', a, k); l.push(a[0]); return null; },
    extend: (l, a, k) => { oneArg(L, 'extend', a, k); l.push(...toList(a[0])); return null; },
    insert: (l, a, k) => { noKw('list.insert', k); if (a.length !== 2) throw TE(`insert expected 2 arguments, got ${a.length}`); let i = toIndex(a[0]); if (i < 0) i = Math.max(0, i + l.length); l.splice(Math.min(i, l.length), 0, a[1]); return null; },
    pop: (l, a, k) => {
      noKw('list.pop', k); range2(L, 'pop', a, 0, 1);
      if (!l.length) throw new PyError('IndexError', 'pop from empty list');
      let i = a.length ? toIndex(a[0]) : -1; if (i < 0) i += l.length;
      if (i < 0 || i >= l.length) throw new PyError('IndexError', 'pop index out of range');
      return l.splice(i, 1)[0];
    },
    remove: (l, a, k) => { oneArg(L, 'remove', a, k); const i = l.findIndex((x) => pyEq(x, a[0])); if (i < 0) throw VE('list.remove(x): x not in list'); l.splice(i, 1); return null; },
    index: (l, a, k) => { noKw('list.index', k); range2(L, 'index', a, 1, 3); const i = l.findIndex((x) => pyEq(x, a[0])); if (i < 0) throw VE(`${pyRepr(a[0])} is not in list`); return i; },
    count: (l, a, k) => { oneArg(L, 'count', a, k); return l.filter((x) => pyEq(x, a[0])).length; },
    sort: (l, a, k, ip) => { if (a.length) throw TE('sort() takes no positional arguments'); const s = sortList(l, k, ip, 'sort'); l.length = 0; l.push(...s); return null; },
    reverse: (l, a, k) => { noArgs(L, 'reverse', a, k); l.reverse(); return null; },
    clear: (l, a, k) => { noArgs(L, 'clear', a, k); l.length = 0; return null; },
    copy: (l, a, k) => { noArgs(L, 'copy', a, k); return l.slice(); },
  };
  const D = 'dict';
  const DICT = {
    get: (d, a, k) => { noKw('dict.get', k); range2(D, 'get', a, 1, 2); const e = d.find(a[0]); return e ? e[1] : a.length > 1 ? a[1] : null; },
    keys: (d, a, k) => { noArgs(D, 'keys', a, k); return new PyDictView(d, 'keys'); },
    values: (d, a, k) => { noArgs(D, 'values', a, k); return new PyDictView(d, 'values'); },
    items: (d, a, k) => { noArgs(D, 'items', a, k); return new PyDictView(d, 'items'); },
    pop: (d, a, k) => {
      noKw('dict.pop', k); range2(D, 'pop', a, 1, 2);
      const e = d.find(a[0]);
      if (!e) { if (a.length > 1) return a[1]; const err = new PyError('KeyError', pyRepr(a[0])); err.keyArg = a[0]; throw err; }
      d.del(a[0]); return e[1];
    },
    update: (d, a, k) => {
      range2(D, 'update', a, 0, 1);
      if (a.length) { const src = a[0]; if (src instanceof PyDict) for (const [x, v] of src.entries()) d.set(x, v); else for (const it of toList(src)) { const p = toList(it); d.set(p[0], p[1]); } }
      for (const key of Object.keys(k)) d.set(key, k[key]);
      return null;
    },
    setdefault: (d, a, k) => { noKw('dict.setdefault', k); range2(D, 'setdefault', a, 1, 2); const e = d.find(a[0]); if (e) return e[1]; const v = a.length > 1 ? a[1] : null; d.set(a[0], v); return v; },
    copy: (d, a, k) => { noArgs(D, 'copy', a, k); const c = new PyDict(); for (const [x, v] of d.entries()) c.set(x, v); return c; },
    clear: (d, a, k) => { noArgs(D, 'clear', a, k); d.m.clear(); return null; },
  };
  const TUPLE = {
    count: (t, a, k) => { oneArg('tuple', 'count', a, k); return t.items.filter((x) => pyEq(x, a[0])).length; },
    index: (t, a, k) => { noKw('tuple.index', k); range2('tuple', 'index', a, 1, 3); const i = t.items.findIndex((x) => pyEq(x, a[0])); if (i < 0) throw VE('tuple.index(x): x not in tuple'); return i; },
  };
  const FLOAT = { is_integer: (f, a, k) => { noArgs('float', 'is_integer', a, k); return Number.isInteger(f.v); } };

  function attrError(obj, name) {
    const owner = typeName(obj);
    const base = `'${owner}' object has no attribute '${name}'`;
    let msg = base;
    if (name[0] !== '_') { const s = suggest(name, DIR[owner] || []); if (s) msg += `. Did you mean: '${s}'?`; }
    const e = new PyError('AttributeError', msg); e.argMsg = base; return e;
  }
  function getAttr(obj, name) {
    let table = null;
    if (typeof obj === 'string') table = STR;
    else if (Array.isArray(obj)) table = LIST;
    else if (obj instanceof PyDict) table = DICT;
    else if (obj instanceof PyTuple) table = TUPLE;
    else if (obj instanceof PyFloat) table = FLOAT;
    else if (obj instanceof PyModule) {
      if (Object.prototype.hasOwnProperty.call(obj.attrs, name)) return obj.attrs[name];
      const base = `module '${obj.name}' has no attribute '${name}'`;
      const s = name[0] !== '_' ? suggest(name, Object.keys(obj.attrs)) : null;
      const e = new PyError('AttributeError', s ? `${base}. Did you mean: '${s}'?` : base); e.argMsg = base; throw e;
    } else if (obj instanceof PyExc && name === 'args') return new PyTuple(obj.args.slice());
    else if (obj instanceof PyFunction && name === '__name__') return obj.name;
    if (table && Object.prototype.hasOwnProperty.call(table, name)) return new PyBound(obj, typeName(obj), name, table[name]);
    const owner = typeName(obj);
    if (DIR[owner] && DIR[owner].includes(name)) throw LIMIT(`${owner}.${name}() is real Python, but it isn't available in this practice app yet.`);
    throw attrError(obj, name);
  }

  // ------------------------------------------------------------------ modules
  const mathFn = (name, f) => new PyBuiltin(name, (args, kw) => {
    noKw(name, kw);
    const xs = args.map((x) => { if (!isNum(x)) throw TE(`must be real number, not ${typeName(x)}`); return num(x); });
    return f(...xs);
  });
  const domain = (ok, v) => { if (!ok) throw VE('math domain error'); return v; };
  const MODULES = {
    math: () => new PyModule('math', {
      pi: new PyFloat(Math.PI), e: new PyFloat(Math.E), tau: new PyFloat(2 * Math.PI), inf: new PyFloat(Infinity), nan: new PyFloat(NaN),
      sqrt: mathFn('sqrt', (x) => new PyFloat(domain(x >= 0, Math.sqrt(x)))),
      floor: mathFn('floor', (x) => Math.floor(x)),
      ceil: mathFn('ceil', (x) => Math.ceil(x)),
      trunc: mathFn('trunc', (x) => Math.trunc(x)),
      fabs: mathFn('fabs', (x) => new PyFloat(Math.abs(x))),
      pow: mathFn('pow', (x, y) => new PyFloat(Math.pow(x, y))),
      log: mathFn('log', (x, b) => new PyFloat(domain(x > 0, b === undefined ? Math.log(x) : Math.log(x) / Math.log(b)))),
      log10: mathFn('log10', (x) => new PyFloat(domain(x > 0, Math.log10(x)))),
      log2: mathFn('log2', (x) => new PyFloat(domain(x > 0, Math.log2(x)))),
      exp: mathFn('exp', (x) => new PyFloat(Math.exp(x))),
      isclose: mathFn('isclose', (a, b) => Math.abs(a - b) <= Math.max(1e-9 * Math.max(Math.abs(a), Math.abs(b)), 0)),
      sin: mathFn('sin', (x) => new PyFloat(Math.sin(x))), cos: mathFn('cos', (x) => new PyFloat(Math.cos(x))), tan: mathFn('tan', (x) => new PyFloat(Math.tan(x))),
    }),
    random: () => new PyModule('random', {
      random: new PyBuiltin('random', () => new PyFloat(Math.random())),
      randint: new PyBuiltin('randint', (args) => { const a = toIndex(args[0]), b = toIndex(args[1]); return a + Math.floor(Math.random() * (b - a + 1)); }),
      choice: new PyBuiltin('choice', (args) => { const l = toList(args[0]); if (!l.length) throw new PyError('IndexError', 'Cannot choose from an empty sequence'); return l[Math.floor(Math.random() * l.length)]; }),
      shuffle: new PyBuiltin('shuffle', (args) => { const l = args[0]; for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return null; }),
    }),
  };

  // ------------------------------------------------------------------ interpreter
  class Interp {
    constructor(opts) {
      this.out = []; this.outLen = 0; this.steps = 0;
      this.maxSteps = opts.maxSteps || 300000;
      this.maxOut = opts.maxOutput || 50000;
      this.globals = new Map();
      this.depth = 0; this.line = 0; this.excStack = [];
      this.globalFrame = { kind: 'global', vars: this.globals };
      this.modules = Object.create(null);
    }
    tick() { if (++this.steps > this.maxSteps) throw new PyError('ProgramTooLong', 'Your program ran for too long, so it was stopped. Check for a loop that never ends.', this.line); }
    write(s) {
      this.outLen += s.length;
      if (this.outLen > this.maxOut) throw new PyError('OutputLimit', 'Your program printed too much (over 50,000 characters), so it was stopped. Check for a loop that never ends.', this.line);
      this.out.push(s);
    }
    module(name) {
      const top = name.split('.')[0];
      if (!MODULES[top]) {
        const e = new PyError('ModuleNotFoundError', `No module named '${name}'`);
        if (['pandas', 'numpy', 'requests', 'matplotlib', 'sklearn'].includes(top)) e.pyType = 'AppLimit', e.pyMsg = `${top} isn't available in this practice app. You'll use it later in full Python.`;
        throw e;
      }
      return this.modules[top] || (this.modules[top] = MODULES[top]());
    }
    execBlock(stmts, f) { for (const s of stmts) this.exec(s, f); }
    exec(s, f) {
      this.line = s.line; this.tick();
      try { this.execInner(s, f); }
      catch (e) { if (e instanceof PyError && !e.line) e.line = s.line; throw e; }
    }
    execInner(s, f) {
      switch (s.type) {
        case 'Expr': this.eval(s.value, f); return;
        case 'Assign': { const v = this.eval(s.value, f); for (const t of s.targets) this.assign(t, v, f); return; }
        case 'AugAssign': return this.augAssign(s, f);
        case 'If': if (truthy(this.eval(s.test, f))) this.execBlock(s.body, f); else this.execBlock(s.orelse, f); return;
        case 'While': {
          let broke = false;
          while (truthy(this.eval(s.test, f))) {
            this.line = s.line; this.tick();
            try { this.execBlock(s.body, f); }
            catch (e) { if (e === BREAK) { broke = true; break; } if (e === CONTINUE) continue; throw e; }
          }
          if (!broke && s.orelse) this.execBlock(s.orelse, f);
          return;
        }
        case 'For': {
          const it = this.eval(s.iter, f);
          let broke = false;
          for (const item of iterate(it)) {
            this.line = s.line; this.tick();
            this.assign(s.target, item, f);
            try { this.execBlock(s.body, f); }
            catch (e) { if (e === BREAK) { broke = true; break; } if (e === CONTINUE) continue; throw e; }
          }
          if (!broke && s.orelse) this.execBlock(s.orelse, f);
          return;
        }
        case 'FunctionDef': {
          const defaults = s.params.map((p) => (p.default ? this.eval(p.default, f) : undefined));
          this.assignName(s.name, new PyFunction(s.name, s.params.map((p) => p.name), defaults, s.body, s.locals, s.globalsDecl, f.kind === 'global' ? null : f), f);
          return;
        }
        case 'Return': throw new ReturnSignal(s.value ? this.eval(s.value, f) : null);
        case 'Pass': case 'Global': return;
        case 'Break': throw BREAK;
        case 'Continue': throw CONTINUE;
        case 'Del': for (const t of s.targets) this.del(t, f); return;
        case 'Import': for (const x of s.names) { const m = this.module(x.name); this.assignName(x.as || x.name.split('.')[0], m, f); } return;
        case 'ImportFrom': {
          const m = this.module(s.module);
          for (const x of s.names) {
            if (!Object.prototype.hasOwnProperty.call(m.attrs, x.name)) throw new PyError('ImportError', `cannot import name '${x.name}' from '${s.module}' (unknown location)`);
            this.assignName(x.as || x.name, m.attrs[x.name], f);
          }
          return;
        }
        case 'Try': return this.tryStmt(s, f);
        case 'Raise': return this.raise(s, f);
        case 'Assert': if (!truthy(this.eval(s.test, f))) throw new PyError('AssertionError', s.msg ? pyStr(this.eval(s.msg, f)) : ''); return;
      }
      throw new PyError('AppLimit', `This kind of statement (${s.type}) isn't supported yet.`);
    }
    toExc(e) {
      if (!(e instanceof PyError)) return null;
      if (e.exc) return e.exc;
      const cls = EXC[e.pyType];
      if (!cls) return null;
      e.exc = new PyExc(cls, e.pyType === 'KeyError' && e.keyArg !== undefined ? [e.keyArg] : e.pyMsg === '' ? [] : [e.argMsg !== null ? e.argMsg : e.pyMsg]);
      return e.exc;
    }
    tryStmt(s, f) {
      let raised = false;
      try {
        try { this.execBlock(s.body, f); }
        catch (e) {
          const exc = this.toExc(e);
          if (!exc) throw e;
          raised = true;
          const h = s.handlers.find((hd) => this.handlerMatches(hd, exc, f));
          if (!h) throw e;
          if (h.name) this.assignName(h.name, exc, f);
          this.excStack.push(e);
          try { this.execBlock(h.body, f); } finally { this.excStack.pop(); }
        }
        if (!raised && s.orelse) this.execBlock(s.orelse, f);
      } finally {
        if (s.finalbody) this.execBlock(s.finalbody, f);
      }
    }
    handlerMatches(h, exc, f) {
      if (!h.type) return true;
      const t = this.eval(h.type, f);
      const types = t instanceof PyTuple ? t.items : [t];
      return types.some((c) => {
        if (!(c instanceof PyExcType)) throw TE('catching classes that do not inherit from BaseException is not allowed');
        return isSub(exc.cls, c);
      });
    }
    raise(s, f) {
      if (!s.exc) {
        const cur = this.excStack[this.excStack.length - 1];
        if (!cur) throw new PyError('RuntimeError', 'No active exception to reraise');
        throw cur;
      }
      let v = this.eval(s.exc, f);
      if (v instanceof PyExcType) v = new PyExc(v, []);
      if (!(v instanceof PyExc)) throw TE('exceptions must derive from BaseException');
      const e = new PyError(v.cls.name, excStr(v), s.line, v);
      throw e;
    }
    del(t, f) {
      if (t.type === 'Name') {
        const fr = f.kind === 'comp' ? f : f;
        const map = fr.kind === 'global' || (fr.fn && fr.fn.globalsDecl.has(t.id)) ? this.globals : fr.vars;
        if (!map.has(t.id)) throw this.nameError(t.id, fr);
        map.delete(t.id); return;
      }
      if (t.type === 'Subscript') {
        const o = this.eval(t.value, f);
        if (t.index.type === 'Slice') throw LIMIT('Deleting slices isn\'t supported in this practice app yet.');
        const k = this.eval(t.index, f);
        if (Array.isArray(o)) { if (!isInt(k)) throw TE(`list indices must be integers or slices, not ${typeName(k)}`); let i = num(k); if (i < 0) i += o.length; if (i < 0 || i >= o.length) throw new PyError('IndexError', 'list assignment index out of range'); o.splice(i, 1); return; }
        if (o instanceof PyDict) { if (!o.del(k)) { const e = new PyError('KeyError', pyRepr(k)); e.keyArg = k; throw e; } return; }
        throw TE(`'${typeName(o)}' object doesn't support item deletion`);
      }
      throw LIMIT('That kind of del isn\'t supported in this practice app.');
    }
    assign(t, v, f) {
      switch (t.type) {
        case 'Name': this.assignName(t.id, v, f); return;
        case 'Subscript': {
          const o = this.eval(t.value, f);
          if (t.index.type === 'Slice') {
            if (!Array.isArray(o)) throw TE(`'${typeName(o)}' object does not support item assignment`);
            const [lo, hi, st] = this.sliceArgs(t.index, f);
            if (st !== null && st !== 1) throw LIMIT('Extended slice assignment isn\'t supported in this practice app.');
            const idx = sliceIndices(o.length, lo, hi, 1);
            const start = idx.length ? idx[0] : (lo === null ? 0 : Math.max(0, Math.min(lo < 0 ? lo + o.length : lo, o.length)));
            o.splice(start, idx.length, ...toList(v));
            return;
          }
          setItem(o, this.eval(t.index, f), v); return;
        }
        case 'Attribute': {
          const o = this.eval(t.value, f);
          throw new PyError('AttributeError', `'${typeName(o)}' object has no attribute '${t.attr}' and no __dict__ for setting new attributes`);
        }
        case 'Tuple': case 'List': {
          const items = toList(v);
          const n = t.items.length;
          if (items.length > n) throw VE(`too many values to unpack (expected ${n})`);
          if (items.length < n) throw VE(`not enough values to unpack (expected ${n}, got ${items.length})`);
          t.items.forEach((x, i) => this.assign(x, items[i], f));
          return;
        }
      }
      throw new PyError('SyntaxError', 'cannot assign to expression');
    }
    augAssign(s, f) {
      const t = s.target;
      const apply = (cur, val) => {
        if (s.op === '+' && Array.isArray(cur)) { cur.push(...toList(val)); return cur; }
        return binop(s.op, cur, val);
      };
      if (t.type === 'Name') { const cur = this.lookup(t.id, f); this.assignName(t.id, apply(cur, this.eval(s.value, f)), f); return; }
      if (t.type === 'Subscript') {
        const o = this.eval(t.value, f);
        const k = this.eval(t.index, f);
        const cur = getItem(o, k);
        setItem(o, k, apply(cur, this.eval(s.value, f)));
        return;
      }
      const o = this.eval(t.value, f);
      throw attrError(o, t.attr);
    }
    lookup(name, f) {
      let fr = f;
      while (fr.kind === 'comp') { if (fr.vars.has(name)) return fr.vars.get(name); fr = fr.parent; }
      if (fr.kind === 'func') {
        if (fr.fn.locals.has(name)) {
          if (fr.vars.has(name)) return fr.vars.get(name);
          throw new PyError('UnboundLocalError', `cannot access local variable '${name}' where it is not associated with a value`);
        }
        for (let c = fr.fn.closure; c; c = c.kind === 'comp' ? c.parent : c.fn ? c.fn.closure : null) {
          if (c.vars.has(name)) return c.vars.get(name);
        }
      }
      if (this.globals.has(name)) return this.globals.get(name);
      if (BUILTINS.has(name)) return BUILTINS.get(name);
      throw this.nameError(name, fr);
    }
    nameError(name, fr) {
      const cands = [];
      if (fr.kind === 'func') cands.push(...fr.vars.keys());
      const globalsList = [...MODULE_GLOBALS, ...this.globals.keys()];
      if (fr.kind !== 'func') cands.push(...globalsList);
      cands.push(...globalsList, ...BUILTIN_NAMES);
      const base = `name '${name}' is not defined`;
      let msg = base;
      const s = suggest(name, cands);
      if (s) msg += `. Did you mean: '${s}'?`;
      if (STDLIB.has(name)) msg += s ? ` Or did you forget to import '${name}'?` : `. Did you forget to import '${name}'?`;
      const e = new PyError('NameError', msg); e.argMsg = base; return e;
    }
    assignName(name, v, f) {
      if (f.kind === 'comp') { f.vars.set(name, v); return; }
      if (f.kind === 'global' || f.fn.globalsDecl.has(name)) { this.globals.set(name, v); return; }
      f.vars.set(name, v);
    }
    sliceArgs(n, f) {
      const g = (x) => { if (!x) return null; const v = this.eval(x, f); if (v === null) return null; if (!isInt(v)) throw TE('slice indices must be integers or None or have an __index__ method'); return num(v); };
      return [g(n.lower), g(n.upper), g(n.step)];
    }
    eval(n, f) {
      switch (n.type) {
        case 'Const': return n.value;
        case 'Name': return this.lookup(n.id, f);
        case 'FStr': return this.fstr(n, f);
        case 'List': return n.items.map((x) => this.eval(x, f));
        case 'Tuple': return new PyTuple(n.items.map((x) => this.eval(x, f)));
        case 'Dict': { const d = new PyDict(); n.keys.forEach((k, i) => { const kv = this.eval(k, f); d.set(kv, this.eval(n.values[i], f)); }); return d; }
        case 'BinOp': {
          const a = this.eval(n.left, f), b = this.eval(n.right, f);
          if (n.op === '@') throw TE(`unsupported operand type(s) for @: '${typeName(a)}' and '${typeName(b)}'`);
          return binop(n.op, a, b);
        }
        case 'Unary': return unary(n.op, this.eval(n.operand, f));
        case 'Not': return !truthy(this.eval(n.operand, f));
        case 'BoolOp': {
          let v = null;
          for (const x of n.values) { v = this.eval(x, f); if (n.op === 'or' ? truthy(v) : !truthy(v)) return v; }
          return v;
        }
        case 'Compare': {
          let left = this.eval(n.left, f);
          for (let i = 0; i < n.ops.length; i++) {
            const right = this.eval(n.comps[i], f);
            if (!compare(n.ops[i], left, right)) return false;
            left = right;
          }
          return true;
        }
        case 'IfExp': return truthy(this.eval(n.test, f)) ? this.eval(n.body, f) : this.eval(n.orelse, f);
        case 'Call': {
          const fn = this.eval(n.func, f);
          const args = n.args.map((a) => this.eval(a, f));
          const kw = Object.create(null);
          for (const k of n.kwargs) kw[k.name] = this.eval(k.value, f);
          return this.callValue(fn, args, kw);
        }
        case 'Attribute': return getAttr(this.eval(n.value, f), n.attr);
        case 'Subscript': {
          const o = this.eval(n.value, f);
          if (n.index.type === 'Slice') { const [lo, hi, st] = this.sliceArgs(n.index, f); return getSlice(o, lo, hi, st); }
          return getItem(o, this.eval(n.index, f));
        }
        case 'ListComp': case 'DictComp': return this.comp(n, f);
        case 'Lambda': {
          const defaults = n.params.map((p) => (p.default ? this.eval(p.default, f) : undefined));
          return new PyFunction('<lambda>', n.params.map((p) => p.name), defaults, [{ type: 'Return', value: n.body, line: n.line }], n.locals, new Set(), f.kind === 'global' ? null : f);
        }
        case 'Slice': throw TE('slices are only allowed inside [ ]');
      }
      throw new PyError('AppLimit', `This kind of expression (${n.type}) isn't supported yet.`);
    }
    comp(n, f) {
      const frame = { kind: 'comp', vars: new Map(), parent: f };
      const isDict = n.type === 'DictComp';
      const out = isDict ? new PyDict() : [];
      const loop = (gi) => {
        if (gi === n.gens.length) {
          if (isDict) out.set(this.eval(n.elt, frame), this.eval(n.value, frame));
          else out.push(this.eval(n.elt, frame));
          return;
        }
        const g = n.gens[gi];
        const it = this.eval(g.iter, gi === 0 ? f : frame);
        for (const item of iterate(it)) {
          this.tick();
          this.assign(g.target, item, frame);
          if (g.ifs.every((c) => truthy(this.eval(c, frame)))) loop(gi + 1);
        }
      };
      loop(0);
      return out;
    }
    fstr(n, f) {
      let s = '';
      for (const p of n.parts) {
        if (p.s !== undefined) { s += p.s; continue; }
        let v = this.eval(p.expr, f);
        if (p.debug) s += p.debug;
        const conv = p.conv || (p.debug && !p.spec ? 'r' : null);
        if (conv === 'r' || conv === 'a') v = pyRepr(v); else if (conv === 's') v = pyStr(v);
        const spec = p.spec ? p.spec.map((x) => (x.s !== undefined ? x.s : formatSpec(this.eval(x.expr, f), ''))).join('') : '';
        s += formatSpec(v, spec);
      }
      return s;
    }
    callValue(fn, args, kw) {
      if (fn instanceof PyBuiltin) { if (!fn.fn) throw TE(`cannot create '${fn.name}' instances`); return fn.fn(args, kw, this); }
      if (fn instanceof PyBound) return fn.fn(fn.self, args, kw, this);
      if (fn instanceof PyFunction) return this.callFunction(fn, args, kw);
      if (fn instanceof PyExcType) { if (Object.keys(kw).length) throw TE(`${fn.name}() takes no keyword arguments`); return new PyExc(fn, args); }
      throw TE(`'${typeName(fn)}' object is not callable`);
    }
    callFunction(fn, args, kw) {
      if (this.depth >= 200) throw new PyError('RecursionError', 'maximum recursion depth exceeded');
      const frame = { kind: 'func', fn, vars: new Map() };
      const P = fn.params, nP = P.length;
      const nReq = fn.defaults.filter((d) => d === undefined).length;
      if (args.length > nP) {
        const takes = nReq === nP ? `${nP} positional argument${nP === 1 ? '' : 's'}` : `from ${nReq} to ${nP} positional arguments`;
        throw TE(`${fn.name}() takes ${takes} but ${args.length} ${args.length === 1 ? 'was' : 'were'} given`);
      }
      args.forEach((a, i) => frame.vars.set(P[i], a));
      for (const k of Object.keys(kw)) {
        if (!P.includes(k)) throw TE(`${fn.name}() got an unexpected keyword argument '${k}'`);
        if (frame.vars.has(k)) throw TE(`${fn.name}() got multiple values for argument '${k}'`);
        frame.vars.set(k, kw[k]);
      }
      const missing = [];
      P.forEach((p, i) => { if (!frame.vars.has(p)) { if (fn.defaults[i] !== undefined) frame.vars.set(p, fn.defaults[i]); else missing.push(p); } });
      if (missing.length) {
        const q = missing.map((m) => `'${m}'`);
        const list = q.length === 1 ? q[0] : q.length === 2 ? `${q[0]} and ${q[1]}` : `${q.slice(0, -1).join(', ')}, and ${q[q.length - 1]}`;
        throw TE(`${fn.name}() missing ${missing.length} required positional argument${missing.length === 1 ? '' : 's'}: ${list}`);
      }
      const saved = this.line;
      this.depth++;
      try { this.execBlock(fn.body, frame); }
      catch (e) { if (e instanceof ReturnSignal) { this.line = saved; return e.value; } throw e; }
      finally { this.depth--; }
      this.line = saved;
      return null;
    }
    snapshotVars() {
      const out = {};
      for (const [k, v] of this.globals) {
        if (v instanceof PyFunction || v instanceof PyBuiltin || v instanceof PyModule || v instanceof PyExcType || v instanceof PyBound) continue;
        let r; try { r = pyRepr(v); } catch (e) { r = '?'; }
        out[k] = { type: typeName(v), repr: r.length > 300 ? r.slice(0, 300) + '…' : r };
      }
      return out;
    }
  }

  function normalize(src) {
    const notes = [];
    let s = String(src).replace(/\r\n?/g, '\n');
    if (/[“”„‘’‚′″]/.test(s)) {
      s = s.replace(/[“”„″]/g, '"').replace(/[‘’‚′]/g, "'");
      notes.push('quotes');
    }
    s = s.replace(/ /g, ' ').replace(/\t/g, '    ');
    return { s, notes };
  }

  function run(code, opts) {
    opts = opts || {};
    const { s, notes } = normalize(code);
    const ip = new Interp(opts);
    let error = null;
    try {
      ip.execBlock(parse(s), ip.globalFrame);
    } catch (e) {
      if (e instanceof PyError) error = { type: e.pyType, message: e.pyMsg, line: e.line || ip.line };
      else if (e instanceof RangeError) error = { type: 'RecursionError', message: 'maximum recursion depth exceeded', line: ip.line };
      else error = { type: 'InternalError', message: String((e && e.message) || e), line: ip.line };
    }
    if (error) error.lineText = error.line ? (s.split('\n')[error.line - 1] || '') : '';
    let vars = {};
    try { vars = ip.snapshotVars(); } catch (e) { vars = {}; }
    return { output: ip.out.join(''), error, notes, vars, steps: ip.steps };
  }

  root.MiniPy = { run, version: '1.0.0' };
})(typeof window !== 'undefined' ? window : globalThis);
