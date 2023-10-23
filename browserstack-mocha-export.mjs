import codeExport from '@seleniumhq/code-export-javascript-mocha';
import { codeExport as exporter } from '@seleniumhq/side-utils'
var emitters = codeExport.opts.emitter.emitters

async function emitSetWindowSize(size) {
    const [width, height] = size.split('x');

    return Promise.resolve(`
      if(!(await driver.getCapabilities()).get("device") && !(await driver.getCapabilities()).get("deviceName"))
      {await driver.manage().window().setRect({width: ${width}, height: ${height}})}
      `);
}

emitters['setWindowSize'] = emitSetWindowSize;

function beforeEach() {
    const params = {
        startingSyntax: ({ capabilities, gridUrl } = {}) => ({
            commands: [
                { level: 0, statement: 'beforeEach(async function() {' },
                {
                    level: 1,
                    statement: `driver = await new Builder()
            .withCapabilities(${JSON.stringify(capabilities)})
            .usingServer('${gridUrl}')
            .build()`,
                },
                {
                    level: 1, statement: `if(process.env.BS_A11Y_TEST_RUN_ID)
            {await driver.sleep(3000);}`
                },
                { level: 1, statement: 'vars = {}' },
            ],
        }),
        endingSyntax: {
            commands: [{ level: 0, statement: '})' }],
        },
    }
    return params
}

codeExport.opts.hooks.beforeEach = new exporter.hook(beforeEach())

function declareVariables() {
    const params = {
        startingSyntax: {
          commands: [
            {
              level: 0,
              statement: `let driver`,
            },
            {
              level: 0,
              statement: 'let vars',
            },
          ],
        },
      }
      return params
}

codeExport.opts.hooks.declareVariables = new exporter.hook(declareVariables())

function generateTestDeclaration(name) {
    return `it('test', async function() {`
}

codeExport.opts.generateTestDeclaration = generateTestDeclaration

export default codeExport