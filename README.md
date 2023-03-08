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
    'bstack:options': 
      browserVersion: 'latest'
      os: "Windows"
      osVersion: '10'
      resolution: "3840x2160",
      projectName: 'My Selenium IDE Project'
      buildName: "My Seleenium IDE Test Suite"
      debug: true
      networkLogs: true
      consoleLogs: "verbose"
server: "https://<bs_username>:<bs_accesskey>@hub-cloud.browserstack.com/wd/hub"
```

