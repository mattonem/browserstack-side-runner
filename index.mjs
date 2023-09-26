#!/usr/bin/env node

import fs from 'fs'
import rimraf from "rimraf";
import path from 'path'
import codeExport from './browserstack-mocha-export.mjs'
import { project as projectProcessor } from '@seleniumhq/side-code-export'
import pkg from '@seleniumhq/side-utils';
import commander from 'commander';
import logger from 'cli-logger';
import glob from 'glob';
import spawn from 'cross-spawn';
import * as dotenv from 'dotenv'; 
import { exit } from 'process';
dotenv.config();
commander
  .usage('[options] project.side [project.side] [*.side]')
  .option('-d, --debug', 'output extra debugging')
  .option('-f, --filter <grep regex>', 'Run tests matching name')
  .option('--base-url <url>', 'Override the base URL that was set in the IDE')
  .option('--test-timeout <ms>', 'Timeout value for each tests. (default: 30000)')
  .option('--browserstack.config <path>','path to browserstack config file, default to browserstack.yml')
  .option('--output-format <json|xunit>', 'Format for the output file.')
  .option('--output-file <path>','path for the report file. required if --output-format provided')

commander.parse(process.argv);
const options = commander.opts();
options.testTimeout = options.testTimeout ? options.testTimeout : 30000
options.filter = options.filter ? options.filter : ''
options.browserstackConfig = options['browserstack.config'] ? options['browserstack.config'] : 'browserstack.yml'
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
  _project.url = options.baseUrl ? options.baseUrl : project.url
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
      var results = await codeExport.default.emit.test({
        baseUrl: options.baseUrl ? options.baseUrl : project.url,
        test: test,
        tests: project.tests,
        project: project
      })
      fs.writeFileSync( path.join(
        options.buildFolderPath,
        results.filename
      ), results.body);
    }
  }

}

var reporter = []
if(options.outputFormat && options.outputFile)
  reporter = [ '--reporter', options.outputFormat, '--reporter-options', 'output=' + options.outputFile]

const testSuiteProcess = spawn.sync('npx', ['browserstack-node-sdk', 'mocha', '_generated', '--timeout', options.testTimeout, '-g', options.filter, '--browserstack.config', options.browserstackConfig, ...reporter], { stdio: 'inherit' });

if(!options.debug)
{
  rimraf.sync(options.buildFolderPath)
}
exit(testSuiteProcess.status)