#!/usr/bin/env node

import fs from 'fs'
import rimraf from "rimraf";
import path from 'path'
import { emitTest, emitSuite } from '@maxmattone/code-export-browserstack-mocha'
import pkg from '@seleniumhq/side-utils';
import commander from 'commander';
import logger from 'cli-logger';
import yaml  from 'js-yaml';
import Mocha from 'mocha';
import glob from 'glob';
import createClone from 'rfdc';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const clone = createClone();

const { project: projectProcessor } = pkg;
import { exec } from "child_process";

commander
  .usage('[options] project.side [project.side] [*.side]')
  .option('-d, --debug', 'output extra debugging')
  .option('-f, --filter <grep regex>', 'Run tests matching name')
  .option('-w, --max-workers <number>', 'Maximum amount of workers that will run your tests, defaults to 1')
  .option('--base-url <url>', 'Override the base URL that was set in the IDE')
  .option('--config, --config-file <filepath>', 'Use specified YAML file for configuration. (default: .side.yml)')
  .option('--output-directory <directory>', 'Write test results to files, format is defined by --output-format')
  .option('--output-format <@mochajs/json-file-reporter|xunit>', 'Format for the output file. (default: @mochajs/json-file-reporter)')

commander.parse(process.argv);
const options = commander.opts();

options.maxWorkers = options.maxWorkers ? options.maxWorkers : 1
options.configFile = options.configFile ? options.configFile : '.side.yml'
options.filter = options.filter ? options.filter : ''
options.outputFormat = options.outputFormat ? options.outputFormat : '@mochajs/json-file-reporter'
options.buildFolderPath = '_generated'

var conf = {level: options.debug ? logger.DEBUG :logger.INFO};
var log = logger(conf);

const sideFiles = [
  ...commander.args.reduce((projects, project) => {
    glob.sync(project).forEach(p => {
      projects.add(p)
    })
    return projects
  }, new Set()),
];

var mocha = new Mocha(
{
    reporter: "mocha-multi-reporters",
    grep: options.filter,
    parallel: true,
    jobs: options.maxWorkers,
    reporterOptions: {
          "reporterEnabled": "spec" + (options.outputDirectory ? ', ' + options.outputFormat :''),
          "mochajsJsonFileReporterReporterOptions": {
            "output": path.join(options.outputDirectory || '', "test-output.json")
          },
          "xunitReporterOptions": {
            "output": path.join(options.outputDirectory || '', "test-output.xunit.xml")
          },
      }
});


rimraf.sync(options.buildFolderPath)
fs.mkdirSync(options.buildFolderPath);

var config
try {
  config = yaml.load(fs.readFileSync(options.configFile));
} catch (e) {
  log.error(e);
}

const projects = sideFiles.map(name => JSON.parse(fs.readFileSync(name)))
var testFileInc = 1;
var promises = [];
projects.forEach(project => {
  project.tests.forEach(test => {
    promises.push(new Promise(async (resolve, reject) => {
    var _config = clone(config);
    _config.capabilities['name'] = test.name
    var packageJson = JSON.parse(fs.readFileSync(__dirname + '/package.json'));
    _config.capabilities['browserstack-side-runner-version'] = packageJson.version
    const result = await emitTest({
      baseUrl: options.baseUrl ? options.baseUrl : project.url,
      test: test,
      tests: project.tests,
      beforeEachOptions: {
        capabilities: _config.capabilities,
        gridUrl: _config.server,
      },});
    var filename = path.join(options.buildFolderPath, testFileInc + result.filename);
    testFileInc ++;
    fs.writeFileSync(filename, result.body);
    mocha.addFile(filename);
    resolve()}))
  })
});
Promise.all(promises).then(()=>{
  mocha.run(function(failures) {
    process.exitCode = failures ? 1 : 0;  // exit with non-zero status if there were failures
    if(!options.debug) rimraf.sync(options.buildFolderPath)
  });

})
