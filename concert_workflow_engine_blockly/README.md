concert workflow engine (blockly)
===============================

## Pre-requisites




### Required Package


```
sudo apt-get install -y git build-essential g++ libxml2-dev libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev
```

### Install node / npm

* install ndoejs

	```
	# Setup nodesource repository
	curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash -

	# Then install
	sudo apt-get install -y nodejs
	```

* upgrade npm

	```
	$ sudo npm install npm -g

	# Check npm version is 2.x.x
	$ npm -v
	```



### Install mongodb

```
$ sudo apt-get install -y mongodb

# check if mongo is running
$ sudo status mongodb
mongodb start/running, process 12406
```

### Rosbridge

* rosbridge
    
    ```
    > sudo apt-get install ros-<version>-rosbridge-suite
    ```




## Installation

* fetch repository

```
cd $PROJECT_PATH
git clone https://github.com/robotics-in-concert/rocon_composer.git
```

* install dependencies

```
cd $PROJECT_PATH/rocon_composer/rocon_composer_blockly
npm install canvas@1.2.1
npm install --ignore-scripts roslib
npm install
```


## Run

1. set environment variables below

<!--
export CONCERT_WORKFLOW_ENGINE_SERVER_PORT=9999
export CONCERT_WORKFLOW_ENGINE_ROSBRIDGE_URL=ws://127.0.0.1:9090
export CONCERT_WORKFLOW_ENGINE_MONGO_URL=mongodb://localhost:27017/rocon_authoring
export CONCERT_COMPOSER_BLOCKLY_DELAY_AFTER_TOPICS=2000
export CONCERT_COMPOSER_BLOCKLY_PUBLISH_DELAY=100
export CONCERT_COMPOSER_BLOCKLY_PUBLISH_DELAY=100
export CONCERT_COMPOSER_BLOCKLY_LOG_LEVEL=info
-->

2. `node rocon_workflow_engine_blockly.js`


### Required Environment Variables

  - `CONCERT_WORKFLOW_ENGINE_BLOCKLY_SERVER_PORT` : The port to run web interface.
  - `CONCERT_WORKFLOW_ENGINE_BLOCKLY_ROSBRIDGE_URL` : Rosbridge websocket URL (eg. ws://127.0.0.1:9090)
  - `CONCERT_WORKFLOW_ENGINE_BLOCKLY_COMPOSER_URL` : rocon composer http url (eg. http://127.0.0.1:9999)
  - `CONCERT_WORKFLOW_ENGINE_BLOCKLY_DELAY_AFTER_TOPICS` : delay in milliseconds after required topics are ready (default: 2000)
  - `CONCERT_WORKFLOW_ENGINE_BLOCKLY_PUBLISH_DELAY` : delay in milliseconds betweeb publishs
  - `CONCERT_WORKFLOW_ENGINE_BLOCKLY_LOG_LEVEL` : log level (default, `info`)
  - `CONCERT_WORKFLOW_ENGINE_BLOCKLY_TOPIC_WAIT_TIMEOUT` : action topic waiting timeout (default: 600000)


### Rosbridge
```
> roslaunch rosbridge_server rosbridge_websocket.launch --screen
```


<!--

#### Command line arguemtns

* `--web` : enable blockly web interface
* `--engine` : enable workflow engine
* `--workflow=workflow1 --workflow==workflow2 ...` : workflow names to load (force engine to start)

-->
