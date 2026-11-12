/**
 * jsdom environment that runs a test file in a given process timezone.
 *
 * Jest hands each test a copy of process.env, so `process.env.TZ = ...` inside
 * a test never reaches V8. The environment runs in the worker itself, where
 * setting TZ does change how Date reads local time. Each worker runs one test
 * file at a time, and the original TZ is restored on teardown.
 *
 * Usage, in the test file's docblock:
 *   @jest-environment ./__tests__/utils/jsdom-timezone-environment.cjs
 *   @timezone Asia/Tokyo
 */
const { TestEnvironment } = require('jest-environment-jsdom');

class JsdomTimezoneEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    const pragma = context.docblockPragmas && context.docblockPragmas.timezone;
    this.timeZone = Array.isArray(pragma) ? pragma[0] : pragma;
  }

  async setup() {
    await super.setup();
    this.originalTimeZone = process.env.TZ;
    if (this.timeZone) {
      process.env.TZ = this.timeZone;
    }
  }

  async teardown() {
    if (this.originalTimeZone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = this.originalTimeZone;
    }
    await super.teardown();
  }
}

module.exports = JsdomTimezoneEnvironment;
