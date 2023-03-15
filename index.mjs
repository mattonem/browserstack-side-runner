#!/usr/bin/env node

import fs from 'fs'
import rimraf from "rimraf";
import path from 'path'
import { emitTest, emitSuite } from '@maxmattone/code-export-browserstack-mocha'
import pkg from '@seleniumhq/side-utils';
import commander from 'commander';
import logger from 'cli-logger';
import glob from 'glob';
import * as child_process from 'child_process'; 

const { project: projectProcessor } = pkg;

commander
  .usage('[options] project.side [project.side] [*.side]')
  .option('-d, --debug', 'output extra debugging')
  .option('-f, --filter <grep regex>', 'Run tests matching name')
  .option('-w, --max-workers <number>', 'Maximum amount of workers that will run your tests, defaults to 1')
  .option('--base-url <url>', 'Override the base URL that was set in the IDE')
  .option('--test-timeout <ms>', 'Timeout value for each tests. (default: 30000)')
  .option('--output-directory <directory>', 'Write test results to files, format is defined by --output-format')
  .option('--output-format <@mochajs/json-file-reporter|xunit>', 'Format for the output file. (default: @mochajs/json-file-reporter)')

commander.parse(process.argv);
const options = commander.opts();

options.maxWorkers = options.maxWorkers ? options.maxWorkers : 1
options.testTimeout = options.testTimeout ? options.testTimeout : 30000
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

rimraf.sync(options.buildFolderPath)
fs.mkdirSync(options.buildFolderPath);

function readFile(filename) {
  return JSON.parse(
    fs.readFileSync(
      path.join(
        '.',
        filename
      )
    )
  )
}

function normalizeProject(project) {
  let _project = { ...project }
  _project.suites.forEach(suite => {
    projectProcessor.normalizeTestsInSuite({ suite, tests: _project.tests })
  })
  return _project
}

for(const sideFileName of sideFiles)
{
  const project = normalizeProject(readFile(sideFileName))
  for(const aSuite of project.suites)
  {
    for(const aTestCase of aSuite.tests)
    {
      const test = project.tests.find(test => test.name === aTestCase);
      var results = await emitTest({
        baseUrl: project.url,
        test: test,
        tests: project.tests,
      })
      fs.writeFileSync( path.join(
        options.buildFolderPath,
        results.filename
      ), results.body);
    }
  }

}

const ls = child_process.spawn('npx', ['browserstack-node-sdk', 'mocha', '_generated', '--timeout', options.testTimeout,'-j', options.maxWorkers, '-g', options.filter]);

ls.stdout.on('data', (data) => {
  console.log(`${data}`);
});

ls.stderr.on('data', (data) => {
  console.error(`${data}`);
});

ls.on(
  'close', (code) => {
  process.exit(code)
});