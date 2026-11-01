// Checks every lesson step against real Python and against the app's own checker.
// Run: node python-steps/tests/test-lessons.mjs   (needs python3 on PATH)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { runPython } from './test-minipy.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ctx = {};
vm.createContext(ctx);
vm.runInContext(readFileSync(path.join(here, '../src/minipy.js'), 'utf8'), ctx);
vm.runInContext(readFileSync(path.join(here, '../src/lessons.js'), 'utf8'), ctx);
const { MiniPy, LESSONS, PSCheck } = ctx;
const norm = (s) => String(s || '').replace(/[ \t]+$/gm, '').replace(/\n+$/, '');

let pass = 0;
const fails = [];
const expect = (cond, label) => { if (cond) pass++; else fails.push(label); };

for (const lesson of LESSONS) {
  lesson.steps.forEach((step, i) => {
    const tag = `Day ${lesson.day} step ${i + 1} (${step.type}: ${step.title})`;
    if (step.type === 'quiz') {
      expect(Number.isInteger(step.answer) && step.options[step.answer] !== undefined, `${tag}: answer index valid`);
      if (step.code) {
        const py = runPython(step.code);
        const want = step.options[step.answer];
        expect(want === 'An error' ? !!py.error : norm(py.output) === want, `${tag}: quiz answer "${want}" matches Python output ${JSON.stringify(py.output)}`);
        const mp = MiniPy.run(step.code);
        expect(mp.output === py.output, `${tag}: quiz code output same in app engine`);
      }
      return;
    }
    const starter = MiniPy.run(step.code);
    const pyStarter = runPython(step.code);
    expect(starter.output === pyStarter.output && (!!starter.error === !!pyStarter.error) && (!starter.error || starter.error.type === pyStarter.error.type), `${tag}: starter behaves like Python (${JSON.stringify(starter.error)} vs ${JSON.stringify(pyStarter.error)})`);
    if (step.type === 'run' || step.type === 'error') {
      expect(PSCheck(step, step.code, starter).ok, `${tag}: starter passes its own check`);
      return;
    }
    expect(!PSCheck(step, step.code, starter).ok, `${tag}: starter does NOT pass before the learner changes it`);
    expect(typeof step.solution === 'string', `${tag}: has a solution`);
    expect(Array.isArray(step.hints) && step.hints.length >= 2, `${tag}: has two hints`);
    const sol = MiniPy.run(step.solution);
    const pySol = runPython(step.solution);
    expect(!sol.error && !pySol.error, `${tag}: solution runs without error (app: ${JSON.stringify(sol.error)}, python: ${JSON.stringify(pySol.error)})`);
    expect(sol.output === pySol.output, `${tag}: solution output matches Python (${JSON.stringify(sol.output)} vs ${JSON.stringify(pySol.output)})`);
    const verdict = PSCheck(step, step.solution, sol);
    expect(verdict.ok, `${tag}: solution passes the check (${JSON.stringify(verdict)})`);
    if (step.check && step.check.out) expect(norm(pySol.output) === norm(step.check.out), `${tag}: expected output equals real Python output`);
  });
}

for (const f of fails) console.log('FAIL', f);
console.log(`\n${pass} checks passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
