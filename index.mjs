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

const { project: projectProcessor } = pkg;
import { exec } from "child_process";

commander
	.option('-d, --debug', 'output extra debugging')
	.option('-f, --filter <string>', 'Run suites matching name')
	.option('-w, --max-workers <number>', 'Maximum amount of workers that will run your tests, defaults to 1')
	.option('--config, --config-file <filepath>', 'Use specified YAML file for configuration. (default: .side.yml)')


commander.parse(process.argv);
const options = commander.opts();

options.maxWorkers = options.maxWorkers ? options.maxWorkers : 1
options.configFile = options.configFile ? options.configFile : '.side.yml'
options.filter = options.filter ? options.filter : '*.side'
options.buildFolderPath = '_generated'

var conf = {level: options.debug ? logger.DEBUG :logger.INFO};
var log = logger(conf);

var mocha = new Mocha(
{
    parallel: true,
    jobs: options.maxWorkers
});

rimraf.sync(options.buildFolderPath)
fs.mkdirSync(options.buildFolderPath);

var config
try {
  config = yaml.load(fs.readFileSync(options.configFile));
} catch (e) {
  log.error(e);
}
const projects = glob.sync(options.filter).map(name => JSON.parse(fs.readFileSync(name)))
var testFileInc = 1;
var promises = [];
projects.forEach(project => {
  project.tests.forEach(test => {
    promises.push(new Promise(async (resolve, reject) => {
    config.capabilities['name'] = test.name
    const result = await emitTest({
      baseUrl: project.url,
      test: test,
      tests: project.tests,
      beforeEachOptions: {
        capabilities: config.capabilities,
        gridUrl: config.server,
      },});
    console.log(result);
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
