# browserstack-side-runner

This project is variant of the [selenium-side-runner](https://github.com/SeleniumHQ/selenium-ide/tree/v3/packages/selenium-side-runner) for running tests against the browserstack grid. 

```sh
npm install @maxmattone/browserstack-side-runner
npx @maxmattone/browserstack-side-runner -w 2 test.side
```
Don't forget to use the config file `.side.yml` like so:
```yml
# this is how your .side.yml should look like
 capabilities:
     browserName: "Chrome"
     browser_version: '81.0'
     os: "Windows"
     os_version: '10'
     resolution: '1024x768'
     build: 'Selenium IDE automate test'
     browserstack.debug: true
     browserstack.console: "verbose"
     browserstack.networkLogs: true
 server: "https://<bs_username>:<bs_accesskey>@hub-cloud.browserstack.com/wd/hub"
```

