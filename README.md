# browserstack-side-runner

This project is variant of the [selenium-side-runner](https://github.com/SeleniumHQ/selenium-ide/tree/v3/packages/selenium-side-runner) for running tests against the browserstack grid. 

```sh
npm install @maxmattone/browserstack-side-runner
npx @maxmattone/browserstack-side-runner test.side
```
Don't forget to use the config file `browserstack.yml` like so:
```yml
# this is how your browserstack.yml should look like
userName: username
accessKey: access_key
platforms:
  - os: Windows
    osVersion: 11
    browserName: Chrome
    browserVersion: 103.0
  - os: Windows
    osVersion: 10
    browserName: Firefox
    browserVersion: 102.0
  - os: OS X
    osVersion: Big Sur
    browserName: Safari
    browserVersion: 14.1
parallelsPerPlatform: 3
browserstackLocal: true
buildName: bstack-demo
projectName: BrowserStack Sample
debug: true
networkLogs: true
consoleLogs: info
```

You can use [this online tool](https://www.browserstack.com/docs/automate/selenium/sdk-config-generator) to generate your config file based on your needs. 
