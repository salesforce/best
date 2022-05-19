# [5.2.0](https://github.com/salesforce/best/compare/v5.1.3...v5.2.0) (2022-05-19)


### Features

* add support for hub with self-signed certs ([78f3c7f](https://github.com/salesforce/best/commit/78f3c7fb113a4eccbf142dbc6c4a783ac741b443))



## [5.1.3](https://github.com/salesforce/best/compare/v5.1.2...v5.1.3) (2022-04-14)


### Bug Fixes

* make front-end show by default the results for the last 2 months ([c41217e](https://github.com/salesforce/best/commit/c41217e6a2b3e6d15c375784245c912f7297f0bc))
* set the correct state for the agent when a client disconnects ([4450abc](https://github.com/salesforce/best/commit/4450abcfda7c26017bcab58c918dc9a3a7c6468c))



## [5.1.2](https://github.com/salesforce/best/compare/v5.1.1...v5.1.2) (2022-04-07)



## [5.1.1](https://github.com/salesforce/best/compare/v4.0.0-alpha12...v5.1.1) (2022-04-07)


### Bug Fixes

* add ssl default config ([c9b339a](https://github.com/salesforce/best/commit/c9b339a35d90363914c7ff15674a11095197c4de))
* add support for new metrics and fallback for unknown metrics ([#225](https://github.com/salesforce/best/issues/225)) ([512a049](https://github.com/salesforce/best/commit/512a049220fc514032efcb0447f7c2b76d052276))
* allow self signed certs in pg ([#232](https://github.com/salesforce/best/issues/232)) ([e90fb40](https://github.com/salesforce/best/commit/e90fb40bd72972b179d50f2711e66444d59f127f))
* **builder:** keep absolute paths ([#255](https://github.com/salesforce/best/issues/255)) ([03b09cc](https://github.com/salesforce/best/commit/03b09cc61f584b84184ade3d67d12168875973fe))
* check for benchmarkIterations in CLI  args ([#245](https://github.com/salesforce/best/issues/245)) ([f4327b2](https://github.com/salesforce/best/commit/f4327b28ea8469280132ec45858ab05adeece831))
* configurable pg config ([#249](https://github.com/salesforce/best/issues/249)) ([d118711](https://github.com/salesforce/best/commit/d118711278e8d602c096fed97a8e89c4e4c3144b))
* Fail compilation is bare module specifier is missing ([#233](https://github.com/salesforce/best/issues/233)) ([0c63282](https://github.com/salesforce/best/commit/0c6328255681a6ebc66b32d446132a7bb31dee64))
* fix cookie consent JS path ([#276](https://github.com/salesforce/best/issues/276)) ([567ac2f](https://github.com/salesforce/best/commit/567ac2f8710b4857e5ddb4a689cad2cceecbfc75))
* fix yarn lock dependency on nexus ([b47bba7](https://github.com/salesforce/best/commit/b47bba792bd98b44cd6c8003f8d3ea111ce86c78))
* make Best work with Node v16 ([563cee2](https://github.com/salesforce/best/commit/563cee248a2b10676325b23fb0b5918c891e94c3))
* missing log method in runner output stream ([7ba77c3](https://github.com/salesforce/best/commit/7ba77c330fb480adc711f2d00885d95cb14d63ca))
* remove check for `.git` in git remote url ([#243](https://github.com/salesforce/best/issues/243)) ([e2125a8](https://github.com/salesforce/best/commit/e2125a8aed7031287d08b76c1a8ebfbc22306b8f))
* rename messenger to runnerStream ([f25c38d](https://github.com/salesforce/best/commit/f25c38db4dd2fb5eb48fa17a9a849cc1ab21deaa))
* store temporary files in unique folder to avoid race conditions ([465ed44](https://github.com/salesforce/best/commit/465ed4427481d2f970ccdf72787d64e3cf0db3ad))
* upgrade deps ([#231](https://github.com/salesforce/best/issues/231)) ([d875fa7](https://github.com/salesforce/best/commit/d875fa74e6cb4104b5b9fb42261e6f79507ee28d))
* upgrade node ([#265](https://github.com/salesforce/best/issues/265)) ([e55aaa1](https://github.com/salesforce/best/commit/e55aaa160819a086950d0726d87df21eb433b204))
* upgrade utils ([b4159a7](https://github.com/salesforce/best/commit/b4159a7c47453fbf21b29f160692125c05466daa))
* vulnerabilities in the `socket.io-file` package ([0a00378](https://github.com/salesforce/best/commit/0a003785aa25a357db9c3961cab44974167efbed))


* fix!: upgrade `puppeteer` to `v13.0.0` ([a8238b8](https://github.com/salesforce/best/commit/a8238b88995413d2209d0fdbb7900b9dfda700a9)), closes [#292](https://github.com/salesforce/best/issues/292)


### Features

* add frontend api for snapshots upload ([a198ce5](https://github.com/salesforce/best/commit/a198ce57af0cacf5436b22080e6180972d612e1a)), closes [#294](https://github.com/salesforce/best/issues/294) [#294](https://github.com/salesforce/best/issues/294)
* add support for http proxy in REST DB Adapter ([f87f332](https://github.com/salesforce/best/commit/f87f332e96ba3b0360006e57c8fbe9adbfcd05c6)), closes [#302](https://github.com/salesforce/best/issues/302)
* **config:** configurable main branch ([#259](https://github.com/salesforce/best/issues/259)) ([f27a8bc](https://github.com/salesforce/best/commit/f27a8bcdd769e13a7ea1773d2486387207a0c486))
* rewrite of Agents, Hubs, Remotes and Algo ([#217](https://github.com/salesforce/best/issues/217)) ([0c1ef01](https://github.com/salesforce/best/commit/0c1ef01d3750318f707c89d85ed07a68718874be))
* **runner-headless:** config to serve static assets ([#257](https://github.com/salesforce/best/issues/257)) ([9fa802f](https://github.com/salesforce/best/commit/9fa802fee96a63a614e4f4bc593bbf29843e5cc8))
* **runner-headless:** configurable launch options ([#256](https://github.com/salesforce/best/issues/256)) ([4a98dd6](https://github.com/salesforce/best/commit/4a98dd6e8fc9adde3effe65730dbd1fa2b109442))


### BREAKING CHANGES

* Upgrade the headless Chrome version to `v97.0.4691.0`.



# [4.0.0-alpha12](https://github.com/salesforce/best/compare/v4.0.0-alpha11...v4.0.0-alpha12) (2019-10-29)


### Bug Fixes

* rollup multiple chunks issues ([#213](https://github.com/salesforce/best/issues/213)) ([8344162](https://github.com/salesforce/best/commit/834416216d89cdbc7b58de25198ab5925de110c5))


### Features

* add job retry on agent connection error ([be1d6c6](https://github.com/salesforce/best/commit/be1d6c6c7781b722e388c7c8b0c92ac64a20f01c))



# [4.0.0-alpha11](https://github.com/salesforce/best/compare/v4.0.0-alpha10...v4.0.0-alpha11) (2019-10-28)


### Features

* add runInBand for better debugging ([#212](https://github.com/salesforce/best/issues/212)) ([e739ee4](https://github.com/salesforce/best/commit/e739ee42d08a1c8e2f5b8de58df8e57672d5af39))



# [4.0.0-alpha10](https://github.com/salesforce/best/compare/v4.0.0-alpha9...v4.0.0-alpha10) (2019-10-25)


### Bug Fixes

* webdriverio to work with IE11 and other browsers ([#209](https://github.com/salesforce/best/issues/209)) ([af061af](https://github.com/salesforce/best/commit/af061af925d9cff248c463b2c60539d158bcc3e9))


### Features

* **runner-headless:** ugprade chrome ([#211](https://github.com/salesforce/best/issues/211)) ([97c0389](https://github.com/salesforce/best/commit/97c03895726827b38994f7c70c9f6582d0ea64a3))



# [4.0.0-alpha9](https://github.com/salesforce/best/compare/v4.0.0-alpha8...v4.0.0-alpha9) (2019-10-16)


### Bug Fixes

* unable to find agent with matching specs ([#203](https://github.com/salesforce/best/issues/203)) ([2ac8238](https://github.com/salesforce/best/commit/2ac82388cc5838af19429c0ee315b0f93426eb75))


### Features

* add latest webdriverIO runner ([#207](https://github.com/salesforce/best/issues/207)) ([7e457b0](https://github.com/salesforce/best/commit/7e457b00a5c3fc2c883631d5f636fb1ddbf6d926))
* add OSS license and copyright headers ([#200](https://github.com/salesforce/best/issues/200)) ([3ee425a](https://github.com/salesforce/best/commit/3ee425adb9652ce5ee9039f9dda9b86158706893))
* add statistic tracking to agent-hub ([#204](https://github.com/salesforce/best/issues/204)) ([929ff5d](https://github.com/salesforce/best/commit/929ff5de4b3c39ecdeb7755af9519fa8e520f619))
* allow mutiple specs per agent ([#201](https://github.com/salesforce/best/issues/201)) ([de23d70](https://github.com/salesforce/best/commit/de23d70af42c72bddede226e809fa4619e57e0ed))
* Documentation! ([#175](https://github.com/salesforce/best/issues/175)) ([e4f9f72](https://github.com/salesforce/best/commit/e4f9f720528aecb077db85d47a26cdd02ec0b7d1))



# [4.0.0-alpha8](https://github.com/salesforce/best/compare/v4.0.0-alpha7...v4.0.0-alpha8) (2019-08-13)


### Bug Fixes

* projects option ([#199](https://github.com/salesforce/best/issues/199)) ([7001a21](https://github.com/salesforce/best/commit/7001a2170983515d6fb6cd4cd5fd23163c70c50a))



# [4.0.0-alpha7](https://github.com/salesforce/best/compare/v4.0.0-alpha6...v4.0.0-alpha7) (2019-08-07)


### Bug Fixes

* remove duplicate yarn prepare ([2b34143](https://github.com/salesforce/best/commit/2b34143a4ec64be9a2090116f79e39283515653c))
* temporary when branch is NOT master ([#197](https://github.com/salesforce/best/issues/197)) ([ffe3c85](https://github.com/salesforce/best/commit/ffe3c852d83da4a5e0bf48f992f9c0380df3293a))



# [4.0.0-alpha6](https://github.com/salesforce/best/compare/v4.0.0-alpha5...v4.0.0-alpha6) (2019-08-05)


### Bug Fixes

* heroku deploy ([bcb43be](https://github.com/salesforce/best/commit/bcb43be2fa77d809312ba063bea3f391d66e8615))
* only show summary when not empty ([#194](https://github.com/salesforce/best/issues/194)) ([16fcb8f](https://github.com/salesforce/best/commit/16fcb8f8625bb3aae016df7280b8fbf19865bcb3))


### Features

* Bug Fixes, Easier Hub Authentication, Filter Out Metrics ([#195](https://github.com/salesforce/best/issues/195)) ([44825a4](https://github.com/salesforce/best/commit/44825a4ec23d18ae10186d88b06e44d404f550f2))
* enable Google Analytics ([3220e97](https://github.com/salesforce/best/commit/3220e97e0746d357dd8fe801cf45ae1cbe2c62ab))



# [4.0.0-alpha5](https://github.com/salesforce/best/compare/v4.0.0-alpha4...v4.0.0-alpha5) (2019-07-31)


### Bug Fixes

* Frontend Graphs Not Resizing ([#191](https://github.com/salesforce/best/issues/191)) ([aaf6473](https://github.com/salesforce/best/commit/aaf6473e10c7bdaa1af97f3135da378ce3d02cfb))
* less restrictive git remote parsing ([#188](https://github.com/salesforce/best/issues/188)) ([5030a07](https://github.com/salesforce/best/commit/5030a078330c45896ddbac2f0332e9871c778c39)), closes [#185](https://github.com/salesforce/best/issues/185)
* update static frontend ([#190](https://github.com/salesforce/best/issues/190)) ([c1e7ff0](https://github.com/salesforce/best/commit/c1e7ff0cf339e8374bc981bd8352dd03679ba597)), closes [#187](https://github.com/salesforce/best/issues/187)
* updated logo ([#192](https://github.com/salesforce/best/issues/192)) ([fc1db72](https://github.com/salesforce/best/commit/fc1db727ee6812be888af8e9c0349cdcfb0cc2ff))


### Features

* Improving GitHub Checks ([#182](https://github.com/salesforce/best/issues/182)) ([4596832](https://github.com/salesforce/best/commit/459683214a34dae842c75c019aeecbf082cb7d28))



# [4.0.0-alpha4](https://github.com/salesforce/best/compare/v4.0.0-alpha3...v4.0.0-alpha4) (2019-07-26)


### Bug Fixes

* New Best Logos in Frontend ([#183](https://github.com/salesforce/best/issues/183)) ([97e25dd](https://github.com/salesforce/best/commit/97e25ddc975a15d57ef2692f3fd84d6054b0123c))



# [4.0.0-alpha3](https://github.com/salesforce/best/compare/v4.0.0-alpha2...v4.0.0-alpha3) (2019-07-26)


### Bug Fixes

* add forgotten dependencies ([#181](https://github.com/salesforce/best/issues/181)) ([6c9f740](https://github.com/salesforce/best/commit/6c9f74020701f7a961e96f7df8eca8176c864b9b))



# [4.0.0-alpha2](https://github.com/salesforce/best/compare/v4.0.0-alpha1...v4.0.0-alpha2) (2019-07-26)


### Bug Fixes

* performance comment ([#176](https://github.com/salesforce/best/issues/176)) ([52d9d3e](https://github.com/salesforce/best/commit/52d9d3e69115dae2e2ec0531a2a3f4f4ee2c5d40))
* Proper handling of authentication error ([#180](https://github.com/salesforce/best/issues/180)) ([7d6baa9](https://github.com/salesforce/best/commit/7d6baa93e3a144c14dae4a46931d7e7c31037e08))
* tokens don't expire by default ([#179](https://github.com/salesforce/best/issues/179)) ([c743277](https://github.com/salesforce/best/commit/c743277bfcd31fa006df100c358c5854cb0a952f))


### Features

* Agent & Hub Frontend ([#178](https://github.com/salesforce/best/issues/178)) ([7c5c22e](https://github.com/salesforce/best/commit/7c5c22e2bf720484deb18844b0c0cc37d2e364a0))
* Proxy Support ([#177](https://github.com/salesforce/best/issues/177)) ([29420b8](https://github.com/salesforce/best/commit/29420b8d1f577ddceab53db250a943727db2fb88))



# [4.0.0-alpha1](https://github.com/salesforce/best/compare/v0.7.1...v4.0.0-alpha1) (2019-07-19)


### Bug Fixes

* add back commitInfo actions ([4fa4254](https://github.com/salesforce/best/commit/4fa4254b37d479f3bf90afd9db2ea41073a6957a))
* add first cli test ([8df8d23](https://github.com/salesforce/best/commit/8df8d23faa33e43210d71aa822ce2fbfef13134f))
* add types to calculateAverageChange in gh-integration ([d357d03](https://github.com/salesforce/best/commit/d357d03a66c2c952fbde137f28eb376cd08f921a))
* allow any benchmark name ([71d4369](https://github.com/salesforce/best/commit/71d43690eb2283f249b72c093a59dc0fa59d61d6))
* almost done with types for analyzer ([91ecf4f](https://github.com/salesforce/best/commit/91ecf4ffd9a1c1dde8e61590a34522cd24a877cc))
* and more types ([1d70187](https://github.com/salesforce/best/commit/1d70187f1b534502b8c4604a0826d5e6db352637))
* better config types ([59110c5](https://github.com/salesforce/best/commit/59110c5694f5759bad1c86696e4ee2a5c17ef155))
* clean command and add build/dist to gitignore ([#154](https://github.com/salesforce/best/issues/154)) ([7f3cf58](https://github.com/salesforce/best/commit/7f3cf5868a1571e8cb389a6c8c6e22f8a7fa35b9))
* cleanup runner ([57223c0](https://github.com/salesforce/best/commit/57223c0addd1bc4502a4947dd3243087c0f178e4))
* clear logs ([cdfe267](https://github.com/salesforce/best/commit/cdfe267d31b7b8a1a213ee7539626e478ff5e8a3))
* config types ([b21bfa3](https://github.com/salesforce/best/commit/b21bfa30a0f4340f0d4c1f7cf6a68b52128f7e7c))
* config types ([097222d](https://github.com/salesforce/best/commit/097222dceb7edf94ebef9d9142e4d82f841cdf41))
* don't overwrite error messages ([d8d0cfa](https://github.com/salesforce/best/commit/d8d0cfacfcc4126ace9449ca0296c165beed0aeb))
* fix tests based on code review ([2317adc](https://github.com/salesforce/best/commit/2317adcd6cad58a219b7690124f56c0edbc587fa))
* fix thumbs up/down in fixture ([9a17cd4](https://github.com/salesforce/best/commit/9a17cd4b8515463dfe8bcdc11c2b7566ac06759a))
* json stringifycation ([335e489](https://github.com/salesforce/best/commit/335e48977e56ac50b1935fcb306f1c85442374e5))
* minor cleanup ([ded739e](https://github.com/salesforce/best/commit/ded739e630d0f41c9b3a7876c36e078bbfd5baa7))
* minor type corrections ([523e443](https://github.com/salesforce/best/commit/523e443dcfb1b8fb48e605161a74755532cd8810))
* missing types in builder,console-stream and store ([#163](https://github.com/salesforce/best/issues/163)) ([1359d13](https://github.com/salesforce/best/commit/1359d13650413cb49a5f8a97b4bfe8ebcc4a4916))
* more result tyeps ([ea90ae3](https://github.com/salesforce/best/commit/ea90ae304d1f28f459eed23dc2909415a76d6043))
* more types ([edb9d25](https://github.com/salesforce/best/commit/edb9d25a09ade938b35967b289c1d7874bd98130))
* more types ([5556ea6](https://github.com/salesforce/best/commit/5556ea60f7c75c74ff3aebabd0ff8de05bb763a4))
* more types ([91dc56e](https://github.com/salesforce/best/commit/91dc56ecf5910a5d13ce499d12b16d3ec8989f05))
* refactor @best/agent using types ([#161](https://github.com/salesforce/best/issues/161)) ([5578e41](https://github.com/salesforce/best/commit/5578e41cb6db67eb0123336e571edb8c3d0a9bfa))
* refactor runner ([4cc0527](https://github.com/salesforce/best/commit/4cc0527c547c1ee5a9a444ee0bd7698460f2a788))
* remove "metric: duration" from github agent comment ([21cd1df](https://github.com/salesforce/best/commit/21cd1dfc20a9f825e6afb58da482882440f4464c))
* stats ([ea9adc0](https://github.com/salesforce/best/commit/ea9adc04734c8a57b90a773c3d808070470b066b))
* types ([#162](https://github.com/salesforce/best/issues/162)) ([5801a33](https://github.com/salesforce/best/commit/5801a3305c25ffaa68f1e59dc55e5808854dbb98))
* Update CI for v4 ([#168](https://github.com/salesforce/best/issues/168)) ([0bd8075](https://github.com/salesforce/best/commit/0bd8075878e9d6ac7aae38345278ba6b697e51d1))
* use performance.mark/measure instead of console.timeStamp() ([0daf847](https://github.com/salesforce/best/commit/0daf8470896a51ca37db3d2eb9ee69b0297bd2b0))


### Features

* add console-stream ([39f12e2](https://github.com/salesforce/best/commit/39f12e2e0701ce67619117b07cb90e64bb325dc7))
* Add Paint and Layout Metrics ([#171](https://github.com/salesforce/best/issues/171)) ([68ae0a5](https://github.com/salesforce/best/commit/68ae0a5ba7761342ff3f865d686e64b6b0b2c90e))
* add types for analysis ([baf1f42](https://github.com/salesforce/best/commit/baf1f426cdb9920aebbf257db8d034be4f8b45d1))
* add types for Cli ([b3f0b42](https://github.com/salesforce/best/commit/b3f0b42faec077a4e9eff08b264d3b641d0a7a16))
* adding declarationMaps ([f9c9713](https://github.com/salesforce/best/commit/f9c9713b5ed5164cc65047e2e8288623e250e394))
* Adds agent-hub and runner-hub and run-in-batch cli arg ([#169](https://github.com/salesforce/best/issues/169)) ([45d96cc](https://github.com/salesforce/best/commit/45d96cc23f9f721773a625af706c15f858fe81cb))
* Agent Frontend ([#174](https://github.com/salesforce/best/issues/174)) ([e7fb568](https://github.com/salesforce/best/commit/e7fb5683523d05caa7675d072d22106b1bbfad98))
* Compare Output & Github Comparison Table ([#164](https://github.com/salesforce/best/issues/164)) ([a96c14c](https://github.com/salesforce/best/commit/a96c14c3e1e75e3e4fcf68e1905f6b7640d4c9dc))
* Decoupled API DB with SQLite Adapter ([#158](https://github.com/salesforce/best/issues/158)) ([ec156b7](https://github.com/salesforce/best/commit/ec156b7ac3ae2773620a4c32e2da164af1609130))
* Default to SQLite Database & Better Migrations ([#166](https://github.com/salesforce/best/issues/166)) ([3fec8e9](https://github.com/salesforce/best/commit/3fec8e90351cd824665474620e8d69f0553e4dc0))
* docs initial design ([#173](https://github.com/salesforce/best/issues/173)) ([3c812d6](https://github.com/salesforce/best/commit/3c812d6c30f38989d3dcf0205acc76d2f7e3ecae))
* first config types ([f71b412](https://github.com/salesforce/best/commit/f71b4120913f720be63705ea29ed80e8b8bf3f1d))
* Frontend Enhancement ([#165](https://github.com/salesforce/best/issues/165)) ([788844d](https://github.com/salesforce/best/commit/788844de1b8488524d2e469154cdd456cad54ec7))
* move all types to new package ([23a4cbf](https://github.com/salesforce/best/commit/23a4cbf264760dce0a44ea6735e84c0b685db038))
* New Frontend Dashboard ([#155](https://github.com/salesforce/best/issues/155)) ([5b4397b](https://github.com/salesforce/best/commit/5b4397bb415ec71e9f076ce69c0484f46e63a6d7))
* New GitHub Integration & Typed Compare ([#159](https://github.com/salesforce/best/issues/159)) ([e7f89e6](https://github.com/salesforce/best/commit/e7f89e60a657fd3481d99eb3b7c07978f4e3531d))
* parallelize benchmarks build ([#170](https://github.com/salesforce/best/issues/170)) ([4b679aa](https://github.com/salesforce/best/commit/4b679aadbcb151a5ca69ac9727d8c3ddd06da33e))
* refactor builder stream ([41c39d2](https://github.com/salesforce/best/commit/41c39d2a274df7c8c7d44e354d514d46ab2ab790))
* result types ([f4f385b](https://github.com/salesforce/best/commit/f4f385bec7b81d5ae4c4570b45ee5819ef3ffcc8))
* Static Frontend ([#160](https://github.com/salesforce/best/issues/160)) ([893d8cf](https://github.com/salesforce/best/commit/893d8cfe6b70f75b15b7f8cfbb93f212aee93fb4))
* wrap comments from github bot in details/summary ([ab3c960](https://github.com/salesforce/best/commit/ab3c9607635e9a5542bb4b85eace0601c519fd53))



## [0.7.1](https://github.com/salesforce/best/compare/v0.7.0...v0.7.1) (2018-11-02)


### Bug Fixes

* integrity ([2fbd68d](https://github.com/salesforce/best/commit/2fbd68d0ce1b74257344624a9c8d375e059319c4))
* prevent local changes from breaking compare ([#129](https://github.com/salesforce/best/issues/129)) ([1879ef3](https://github.com/salesforce/best/commit/1879ef3466ac8fd721c1947ad53bce59fa4967d5))



# [0.7.0](https://github.com/salesforce/best/compare/v0.6.4...v0.7.0) (2018-09-25)


### Features

* **best:** abstract runner ([4efe52c](https://github.com/salesforce/best/commit/4efe52c9ca6689d27d840a8c47ea7324d6be137b))
* **best:** class-ify runners ([212a168](https://github.com/salesforce/best/commit/212a168477b3dab2c921fed32fd196ff6de25c06))
* **best:** http support ([b4c3e3e](https://github.com/salesforce/best/commit/b4c3e3ee1e9dba258290b68e0623a6d04230c346))



## [0.6.4](https://github.com/salesforce/best/compare/v0.6.3...v0.6.4) (2018-09-25)


### Bug Fixes

* correctly use rollup cache ([324cde7](https://github.com/salesforce/best/commit/324cde7ef0b52195bbd03d22a28b204db4c450d9))



## [0.6.3](https://github.com/salesforce/best/compare/v0.6.2...v0.6.3) (2018-09-24)


### Bug Fixes

* upgrade rollup to fix wrong mangling ([#126](https://github.com/salesforce/best/issues/126)) ([bdca3f6](https://github.com/salesforce/best/commit/bdca3f6c10944b2ea6b533c0bc8531c4f5ad5c34))



## [0.6.2](https://github.com/salesforce/best/compare/v0.6.1...v0.6.2) (2018-09-21)


### Performance Improvements

* adding rollup cache for massive improvement of builds ([#125](https://github.com/salesforce/best/issues/125)) ([fab2c91](https://github.com/salesforce/best/commit/fab2c91428d49fedb5a768d589948511f02cf2f7))



## [0.6.1](https://github.com/salesforce/best/compare/v0.6.0...v0.6.1) (2018-09-18)


### Features

* added option to ignore test paths via config ([#123](https://github.com/salesforce/best/issues/123)) ([d9d61a9](https://github.com/salesforce/best/commit/d9d61a90b12f9c03811826120fd6849a52d5e535))



# [0.6.0](https://github.com/salesforce/best/compare/v0.5.2...v0.6.0) (2018-09-04)


### Bug Fixes

* added meta tag with highest doc mode support in IE ([13a68c8](https://github.com/salesforce/best/commit/13a68c868fceb127cb98968063e598a4f4fb762c))
* any number of project configs is processed ([#114](https://github.com/salesforce/best/issues/114)) ([c72dced](https://github.com/salesforce/best/commit/c72dced78c2cb515127eca0962f24fcde48ff5ce))
* **best:** Normalize name patterns ([f1fb00c](https://github.com/salesforce/best/commit/f1fb00cbbf39cbddb316cfb16a230d00e8f16bf8))
* **best:** simple-statistics and asciitable dependencies ([6e42893](https://github.com/salesforce/best/commit/6e42893758f8f6a0632cdcde50e05e95ee50123d))
* better path pattern matching ([#111](https://github.com/salesforce/best/issues/111)) ([6294d67](https://github.com/salesforce/best/commit/6294d67c9798babed3a047c902b144b58d94e85b))
* parsing error timeout ([#121](https://github.com/salesforce/best/issues/121)) ([d283352](https://github.com/salesforce/best/commit/d283352eb6297499a2d68fa0dfeabd5df505c631))
* Upgrade pupeteer and fix trend ([#122](https://github.com/salesforce/best/issues/122)) ([d041743](https://github.com/salesforce/best/commit/d041743cd2ea6a5a014283be58d8f03ad16b75d2))


### Features

* added ssl support to best agent ([4d06027](https://github.com/salesforce/best/commit/4d06027ecec1f39dce7b78aa7f43457800873013))
* **best:** CLI histograms ([c0f7a73](https://github.com/salesforce/best/commit/c0f7a734b94f459c91873571e04b8121ddc283cb))
* **best:** Fix comparison commit headings ([a3a0dd6](https://github.com/salesforce/best/commit/a3a0dd67fd0bed336da11c0cd0ec036acd23db64))



## [0.5.2](https://github.com/salesforce/best/compare/v0.5.1...v0.5.2) (2018-06-01)


### Bug Fixes

* **best:** Fix building on windows machine ([bea8ed1](https://github.com/salesforce/best/commit/bea8ed1e5cc7c22c621c06969a48918bf8cc4875))
* **best:** fix timeout and config ([cb0f011](https://github.com/salesforce/best/commit/cb0f011390c822276a928ebd067a1ba886b8d82c))
* **best:** Temporary fix for IE11 ([6fab658](https://github.com/salesforce/best/commit/6fab658e4bd2af6e48a9101ce75642cf94b3a436))
* **best:** Updated yarn.lock ([63d97c6](https://github.com/salesforce/best/commit/63d97c691e1099ff40bc3155ee72c10096344d48))
* **best:** Use simple-git/promise instead of child_process.spawn ([3d01709](https://github.com/salesforce/best/commit/3d01709dc402c37e00149095c3a1fd6e5ed52fb9))


### Features

* **best:** Add IE11 runner and configuration ([7d6f124](https://github.com/salesforce/best/commit/7d6f1245f2e42800c4319ebcb33a5b9f618d2528))
* **best:** Compare against local changes ([b45a014](https://github.com/salesforce/best/commit/b45a014152bc1f374e7fe29ca9afac27c8483c17))
* **best:** Converted IE runner into general webdriver runner ([6061f7d](https://github.com/salesforce/best/commit/6061f7d4b7ee4c74fc1d746d5daba4ce3647cfb7))
* **git:** update husky with commitlint ([#110](https://github.com/salesforce/best/issues/110)) ([8c7f1f0](https://github.com/salesforce/best/commit/8c7f1f08cfa2f62cf7871fe29abf734e04fd3d04))
* Split config for sample benchmark into prod and compat config ([0d7d022](https://github.com/salesforce/best/commit/0d7d02251b7e8c612a24e9bd696c0863aeab194b))



## [0.5.1](https://github.com/salesforce/best/compare/v0.5.0...v0.5.1) (2018-05-17)


### Features

* **best:** very simple customizable test template ([9bab3a4](https://github.com/salesforce/best/commit/9bab3a49f86b65bd6d8f839590b2b81ffa9b0115))



# [0.5.0](https://github.com/salesforce/best/compare/v0.4.1...v0.5.0) (2018-03-22)


### Features

* Allowing custom runner configs ([#99](https://github.com/salesforce/best/issues/99)) ([6b7a8ef](https://github.com/salesforce/best/commit/6b7a8effefb8c793b82ffb7b3cb19e668727f8f6))



## [0.4.1](https://github.com/salesforce/best/compare/v0.4.0...v0.4.1) (2018-03-19)


### Bug Fixes

* Best agent configuration and forwarding methods ([#98](https://github.com/salesforce/best/issues/98)) ([6c9e9c1](https://github.com/salesforce/best/commit/6c9e9c10f707727431121c57da4364832996e085))



# [0.4.0](https://github.com/salesforce/best/compare/v0.3.2...v0.4.0) (2018-03-19)


### Bug Fixes

* Simplify github config ([#95](https://github.com/salesforce/best/issues/95)) ([9a502c6](https://github.com/salesforce/best/commit/9a502c69e88b3279b7685223956282be070b6d0d))


### Features

* Allow local (fs) comparison ([#96](https://github.com/salesforce/best/issues/96)) ([5781d55](https://github.com/salesforce/best/commit/5781d556afedd1232c379d34bf655cefe3280875))
* **commit:** add commit validation ([#94](https://github.com/salesforce/best/issues/94)) ([e1bdbb7](https://github.com/salesforce/best/commit/e1bdbb7cf8777bf450e20bed91e740a364458f6b))
* Refactor git and cli table display ([#97](https://github.com/salesforce/best/issues/97)) ([0fc095f](https://github.com/salesforce/best/commit/0fc095f6b44471376f70ab372628ddecc05a5e9e))



## [0.3.2](https://github.com/salesforce/best/compare/v0.3.1...v0.3.2) (2018-03-15)


### Bug Fixes

* Git integration, FE plot index ([#93](https://github.com/salesforce/best/issues/93)) ([9dad1fb](https://github.com/salesforce/best/commit/9dad1fbe005172be2456977b259dc9572422c447))



## [0.3.1](https://github.com/salesforce/best/compare/v0.3.0...v0.3.1) (2018-03-08)


### Bug Fixes

* Disambiguate paths for build ([#88](https://github.com/salesforce/best/issues/88)) ([f5e6290](https://github.com/salesforce/best/commit/f5e6290e433f99e93a5bb9e1580529450f261ebc))



# [0.3.0](https://github.com/salesforce/best/compare/v0.2.0...v0.3.0) (2018-03-07)


### Bug Fixes

* Disambiguate multiple project benchmarks ([#86](https://github.com/salesforce/best/issues/86)) ([8eb441c](https://github.com/salesforce/best/commit/8eb441cfb48dbfc79e5f7dde590340b7dca5d1fe))



# [0.2.0](https://github.com/salesforce/best/compare/v0.1.0...v0.2.0) (2018-02-16)



# [0.1.0](https://github.com/salesforce/best/compare/v0.0.13...v0.1.0) (2018-02-16)


### Bug Fixes

* **best-build:** Allow custom plugins ([#84](https://github.com/salesforce/best/issues/84)) ([8f77b1e](https://github.com/salesforce/best/commit/8f77b1e66f84706fa06d62d0ecdc8a744ee2e306))



## [0.0.13](https://github.com/salesforce/best/compare/v0.0.12...v0.0.13) (2018-02-12)


### Bug Fixes

* **best-analyzer:** Allow multi-project comparison ([#82](https://github.com/salesforce/best/issues/82)) ([3431292](https://github.com/salesforce/best/commit/34312920b6a316dd3462f3788521f3d008346c89))



## [0.0.12](https://github.com/salesforce/best/compare/v0.0.11...v0.0.12) (2018-02-11)


### Bug Fixes

* **best-build:**  Guard against ambiguous benchmark filename  ([#78](https://github.com/salesforce/best/issues/78)) ([b9c3f71](https://github.com/salesforce/best/commit/b9c3f71f2e92e8ffe8fca8beb72e2af23adef1bb))
* **best-frontend:** Allow retry for gitIntegration ([#76](https://github.com/salesforce/best/issues/76)) ([53c4cf6](https://github.com/salesforce/best/commit/53c4cf61192b448060f9b8d86e9e3e3130f0a450))
* **best-frontend:** Fix defaults. Adding minor guards ([#81](https://github.com/salesforce/best/issues/81)) ([5992eaf](https://github.com/salesforce/best/commit/5992eaf6ae00a5e95f7a351034794979237822e3))
* **best-frontend:** Fix Retry for git authorization ([#79](https://github.com/salesforce/best/issues/79)) ([57b7c21](https://github.com/salesforce/best/commit/57b7c2122a52810ec795a515189e05963c0e4e3d))
* **best-frontend:** Missing parameter ([6373de4](https://github.com/salesforce/best/commit/6373de4c69ae3555d1d3f7cc062d494ba446a36a))
* **best-frontend:** Refactor FE package ([1fb2089](https://github.com/salesforce/best/commit/1fb20893b1844d8101f4bd107a6ee20886343e27))
* **best-frontend:** Uncomment critical code ([1fe9f61](https://github.com/salesforce/best/commit/1fe9f616b01ab8268432ff934a904489ae9e5456))



## [0.0.11](https://github.com/salesforce/best/compare/v0.0.10...v0.0.11) (2018-02-07)


### Bug Fixes

* **best-frontend:** Fix Tab switching ([#73](https://github.com/salesforce/best/issues/73)) ([57f2d08](https://github.com/salesforce/best/commit/57f2d08d7c17a613027d55e5ea1db8cd8dcba123))
* **best-github-integration:** Simplify authentication + Git based order ([#74](https://github.com/salesforce/best/issues/74)) ([a2f92ed](https://github.com/salesforce/best/commit/a2f92edf8503d99d35f1d91da7418d5d6c3a82b9))



## [0.0.10](https://github.com/salesforce/best/compare/v0.0.7...v0.0.10) (2018-02-06)


### Features

* **best-build:** Allow prod + Upgrade LWC deps ([#71](https://github.com/salesforce/best/issues/71)) ([e3376ac](https://github.com/salesforce/best/commit/e3376ac60f1ed7dc8354cf43caa13b25579dbabd))
* **best-compare:** Fix comparer recursivity ([#65](https://github.com/salesforce/best/issues/65)) ([bf6efec](https://github.com/salesforce/best/commit/bf6efec1f6762cd2829f43cac2f81df74fc3d1c5))
* **best-config:** Enable multi-project configurations ([#60](https://github.com/salesforce/best/issues/60)) ([aa0a3d7](https://github.com/salesforce/best/commit/aa0a3d755c2bd560d7a8b73f2c6545ae18857461))
* **best-frontend:** Adding frontend package ([#66](https://github.com/salesforce/best/issues/66)) ([f9f5222](https://github.com/salesforce/best/commit/f9f52226d7677d4d82a0fc41f1c5ab3d15eec7e7))
* **best-frontend:** Allow heroku deployment ([#70](https://github.com/salesforce/best/issues/70)) ([a3d5ce1](https://github.com/salesforce/best/commit/a3d5ce1fc44f1b3b2d3c72c39d69e8bd2b71aaef))
* **best-frontend:** Fix naming ([#68](https://github.com/salesforce/best/issues/68)) ([013b196](https://github.com/salesforce/best/commit/013b196e2c986b64a35b843a52cb69cdbe02053a))
* **best-frontend:** Fix ploty axis ([#69](https://github.com/salesforce/best/issues/69)) ([38d5092](https://github.com/salesforce/best/commit/38d5092bad78ec2f9b7ba19df47036df6bf382ab))
* **best-stats:** Normalize stats for results ([#62](https://github.com/salesforce/best/issues/62)) ([1ddaa57](https://github.com/salesforce/best/commit/1ddaa57ca71e0faa9280f7b239a2e48f9818b3db))
* **best-store:** Closing the gaps store APIs ([6159192](https://github.com/salesforce/best/commit/61591924d7973af8ffb36cfe3f3af7646c2e9e82))



## [0.0.7](https://github.com/salesforce/best/compare/v0.0.6...v0.0.7) (2018-01-20)



## [0.0.6](https://github.com/salesforce/best/compare/v0.0.5...v0.0.6) (2018-01-20)


### Bug Fixes

* **store:** Adding default commit size to 7 characters ([#50](https://github.com/salesforce/best/issues/50)) ([e3261c0](https://github.com/salesforce/best/commit/e3261c042ba6280b178e836bc69f7ec7524f39de))


### Features

* **changelog:** Add conventional-commits, commitizen, and auto-changelog generation ([#39](https://github.com/salesforce/best/issues/39)) ([93d853d](https://github.com/salesforce/best/commit/93d853dd845ff1b426f77f49a9762047dede5e29))



## [0.0.5](https://github.com/salesforce/best/compare/v0.0.4...v0.0.5) (2018-01-08)



## [0.0.4](https://github.com/salesforce/best/compare/v0.0.3...v0.0.4) (2018-01-07)


### Bug Fixes

* Comparing results ([#16](https://github.com/salesforce/best/issues/16)) ([0197fa7](https://github.com/salesforce/best/commit/0197fa738ed7fc51a2331719f5ff13144e150247))
* Identical hash commits should skip comparison ([#19](https://github.com/salesforce/best/issues/19)) ([38f1911](https://github.com/salesforce/best/commit/38f19116ca5e4177c17b39dcad155a4863574adf))



## [0.0.3](https://github.com/salesforce/best/compare/v0.0.2...v0.0.3) (2018-01-03)



## 0.0.2 (2018-01-03)



