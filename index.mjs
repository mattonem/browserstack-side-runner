#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { emitTest, emitSuite } from '@maxmattone/code-export-browserstack-mocha'
import pkg from '@seleniumhq/side-utils';
import commander from 'commander';
import logger from 'cli-logger';
import yaml  from 'js-yaml';

const { project: projectProcessor } = pkg;
import { exec } from "child_process";

commander
	.option('-d, --debug', 'output extra debugging')
	.option('-f, --filename <filename>', 'path the test.side file')
	.option('-w, --max-workers <number>', 'Maximum amount of workers that will run your tests, defaults to 1')
	.option('--config, --config-file <filepath>', 'Use specified YAML file for configuration. (default: .side.yml)')


commander.parse(process.argv);
const options = commander.opts();

options.maxWorkers = options.maxWorkers ? options.maxWorkers : 1
options.configFile = options.configFile ? options.configFile : '.side.yml'
var conf = {level: options.debug ? logger.DEBUG :logger.INFO};
var log = logger(conf);
function readFile(filename) {
  return JSON.parse(
    fs.readFileSync(
      path.join(
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
var config
try {
  config = yaml.load(fs.readFileSync(options.configFile));
} catch (e) {
  log.error(e);
}

const project = readFile(options.filename)
var results = [];
log.debug(project);
for (let index = 0; index < project.tests.length; index++)
{
  config.capabilities['name'] = project.tests[index].name
  results.push( await emitTest({
     baseUrl: project.url,
     test: project.tests[index],
     tests: project.tests,
     beforeEachOptions: {
        capabilities: config.capabilities,
        gridUrl: config.server,
      },
}))
}
log.debug(results);
results.forEach(file => 
	fs.writeFile(file.filename, file.body, function (err,data) {
  		if (err) {
    		return log.error(err);
  		}})
	);
var command = `npx mocha --parallel -j ${options.maxWorkers} `
for (let index = 0; index < results.length; index++)
{
	command += results[index].filename + ' '
}
log.debug(command);

exec(command, (error, stdout, stderr) => {
    if (error) {
        log.error(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        log.error(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});