var _ = require('lodash'),
  $ = require('jquery'),
  Blockly = require('blockly'),
  BlockGenerator = require('../block_gen'),
  ros_block_override = require('../blocks/blocks_defaults'),
  R = require('ramda'),
  UndoManager = require('../undo_manager'),
  Utils = require('../utils');
              
              
function WorkflowBlocklyCtrl($scope, blocksStore, $http, $rootScope, $stateParams, $modal, $q) {
  Blockly.inject(document.getElementById('blocklyDiv'),
    {path: './', toolbox: document.getElementById('toolbox')});
  var undo_manager = new UndoManager();
  undo_manager.start();


  $rootScope.$on('$stateChangeStart', function(e, to) {
    var dirty = checkDirty()
    if(dirty){
      if(dirty == 'not exists'){
        var msg =  'unsaved - want leave?';
      }else if(dirty == 'changed'){
        var msg =  'changed - want leave?';
      }
      if(!confirm(msg)){
        e.preventDefault();
      }
      window.onbeforeunload = null;

    }

  });


  $scope.modalBlockConfig = function(){
    var modalInstance = $modal.open({
      templateUrl: '/js/tpl/block_config.html',
      controller: require('./config_ctrl'),
      controllerAs: 'ctrl',
      resolve: {
        rapps: function(){
          return $rootScope.rapps;
        }

      }
    });
    

  };

  window.onbeforeunload = function(e){
    var dirty = checkDirty()
    if(dirty){
      if(dirty == 'not exists'){
        return 'unsaved';
      }else if(dirty == 'changed'){
        return 'changed';
      }
    }
    window.onbeforeunload = null;
    return null;
  };

  var checkDirty = function(){
    var exists = R.find(R.propEq('id', $scope.current.id))($scope.items);
    if(!exists){
      return 'not exists';
    }

    if(exists.xml != _xml()){
      return 'changed';
    }

    return false;
  };

  $scope.foo = 'bar';

  $scope.itemSelection = [];
  $scope.rapp_url = "http://files.yujinrobot.com/rocon/rapp_repository/office_rapp.tar.gz";
  $scope.robot_brain = {};



  $rootScope.$on('items:loaded', function(){
    Utils.reload_udf_blocks($scope.items);
    if($stateParams.id){ // load
      $scope.load($stateParams.id);
    }
  });
  $rootScope.$on('items:saved', function(){
    Utils.reload_udf_blocks($scope.items);

    $('#alert .alert').html('Saved');
    $('#alert').show().delay(500).fadeOut('fast');

  });

  var resetCurrent = function(){
    $scope.current = {id: Utils.uuid(), title: 'Untitled', description: 'Service Description', created_at: new Date().getTime()};
  };
  resetCurrent();
  if($stateParams.new_name){
    $scope.current.title = $stateParams.new_name;
  }


  var setupEditable = function(re){
    $('#description, #title').editable('destroy');

    $('#title').editable({
      display: function(){
        $(this).html($scope.current.title);
      },
      value: $scope.current.title,
      success: function(res, newv){
        $scope.current.title = newv;
      }
    });
    $('#description').editable({
      display: function(){
        $(this).html($scope.current.description);
      },
      value: $scope.current.description,
      success: function(res, newv){
        $scope.current.description = newv;
      }
    });

  };

  $rootScope.$on('$viewContentLoaded', function() {
    setupEditable();
  });

  $scope.save = function() {
    var cur = $scope.current;


    var id = $scope.current.id;
    var title = $scope.current.title;
    var description = $scope.current.description;
    var created_at = $scope.current.created_at;
    try {
      var js = _js();
      var xml = _xml();
    }catch(e){
      alert('failed to save : ' + e.message);

      return null;

    }


    var idx = _.findIndex($scope.items, {id: id});
    if(idx >= 0){
      $scope.items[idx] = {id: id, js: js, xml: xml, title: $scope.current.title, description: description, created_at: created_at};
      console.log(1);


    }
    else {
      var sameTitleIdx = R.findIndex(R.propEq('title', cur.title))($scope.items);
      if(sameTitleIdx >= 0){
        alert('item with same title exists');
        return;

      }
      
      $scope.items.push({id: id, title: title, js: js, xml: xml, description: description, created_at: created_at});
      console.log(2);

    }
    
  };
  Mousetrap.bind('ctrl+s', function(){
    console.log('save triggered');
    $scope.$apply(function(){
      $scope.save();
    });

  });




  var loadBlocks = function(url){
    var $tb = $('#toolbox');
    var generator = new BlockGenerator();
    

    $q.all([blocksStore.loadRapp(), blocksStore.loadInteractions()]).then(function(data){
      var x = data[0];
      var interactions = data[1];

      // 
      // Rapps
      // 
      console.groupCollapsed("Rapp Blocks");

      generator.generate_message_blocks(x.types);

      R.mapObj.idx(function(subTypes, k){
        var $el = generator.message_block_dom(k, subTypes);
      })(x.types);

      /*
       * Rapp blocks
       */
      _.each(x.rapps, function(rapp){
        _.each(rapp.rocon_apps, function(rocon_app, key){
          var meta = rocon_app.public_interface;
          var rapp_name = [rapp.name, key].join("/");
          var compat = 'rocon:/pc';
          var $ros = $tb.find('category[name=Rocon]');


          R.forEach(function(pair){
            if(!pair[0]){
              return;
            }
            R.forEach(function(sub){
              var $b = pair[1](
                rapp_name, compat,
                sub.name,
                sub.type);
              $ros.append($b);

            })(pair[0]);

          })([
            [meta.action_servers, generator.scheduled_action_block_dom.bind(generator)],
            [meta.publishers, generator.scheduled_subscribe_block_dom.bind(generator)],
            [meta.subscribers, generator.scheduled_publish_block_dom.bind(generator)]
          ]);

        });

      });
      console.groupEnd();

      //
      // interactions
      //
      console.groupCollapsed('Load interactions');
      console.log(interactions);

      generator.generate_message_blocks(interactions.types);
      R.mapObj.idx(function(subTypes, k){
        var $el = generator.message_block_dom(k, subTypes);
      })(interactions.types);


      var sub_topics_el = R.compose(
        R.map(function($el){ $tb.find('category[name=Rocon]').append($el); }),
        R.map(R.bind(generator.generate_client_app_blocks, generator)),
        R.reject(R.isEmpty),
        R.flatten,
        R.map(function(i){ return {interface: i.interface, client_app_name: i.name, client_app_id: i._id}; })
        // R.mapProp('interface'),
        // R.map(function(i){ i.interface = R.map(R.assoc('client_app_id', i._id))(i.interface); return i;})
      )(interactions.data);
      


      console.groupEnd();

      // IMPORTANT
      ros_block_override();


      console.log('----------------------a');
      console.log($('#toolbox').get(0));



      Blockly.updateToolbox($('#toolbox').get(0));
      console.log('----------------------/a');
      Utils.reload_udf_blocks($scope.items);

    })
    .catch(function(e){
      console.error('cannot load blocks - msg database error', e);

      
    })
      

  };
  _.defer(loadBlocks);


  $scope.engineLoadChecked = function(){
    var items = $scope.itemSelection;
    console.log(items);

    if(items.length < 1){
      alert('select items to load.');
    }else{
      $http.post('/api/engine/load', {blocks: $scope.itemSelection}).then(function(){
        alert('ok');
      });
    }

  };
  $scope.engineReset = function(){
    $http.post('/api/engine/reset').then(function(){
      alert('ok');
    });

  };

  /**
   * workspace
   *
   */
  $scope.clearWorkspace = function() {
    Blockly.mainWorkspace.clear();
  };

  // $scope.runCurrent = function() {
    // var code;
    // code = Blockly.JavaScript.workspaceToCode();
    // console.log(code);
    // blocksStore.eval(code);

  // };

  $scope.deleteItem = function(id) {
    console.log($scope.items);

    var idx = R.findIndex(R.propEq('id', id))($scope.items);
    if(idx >= 0){
      $scope.items.splice(idx, 1);
      console.log('deleted');
    }
    $scope.current = null;
  };

  $scope.newData = function() {
    Blockly.mainWorkspace.clear();
    resetCurrent();
    setupEditable();

  };
  $scope.load = function(id) {

    var data = R.find(R.propEq('id', id))($scope.items);
    $scope.current = data;
    setupEditable(true);
    console.log(data);


    dom = Blockly.Xml.textToDom(data.xml);
    Blockly.mainWorkspace.clear();

    try{
      Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, dom);
    }catch(e){
      alert('failed to load blocks - '+e.toString());

    }
  };





  /**
   * items checkbox
   */
  $scope.toggleItemSelection = function(id){

    _.include($scope.itemSelection, id) ?
      _.pull($scope.itemSelection, id) :
      $scope.itemSelection.push(id)

  };


  $scope.exportItems = function(){
    var pom = document.createElement('a');
    R.map(function(id){
      var item = R.find(R.propEq('id', id))($scope.items);


      console.log('data:application/json;charset=utf-8,' + JSON.stringify(item));
      pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + JSON.stringify(item))
      pom.setAttribute('download', item.title + ".json");
      pom.click();

    })($scope.itemSelection);

    _.times(2, function(){
    });

  };
  $scope.importItems = function(){
    $('#itemsFile').click()
  };
  $scope.itemsFileNameChanged = function(e){
    console.log('here!');

    var files = e.files;
    var f = files[0];

    var r = new FileReader();
    r.onload = function(e) { 
      var json = e.target.result;
      console.log(json);

      var item = JSON.parse(json);
      console.log(item);





      var sameTitleIdx = R.findIndex(R.propEq('title', item.title))($scope.items);
      console.log(sameTitleIdx);
      if(sameTitleIdx >= 0){
        if(confirm('item with same title exists, overrite?')){
          $scope.$apply(function(){
            item.id = Utils.uuid();
            $scope.items[sameTitleIdx] = item;
          });
        }
      }else{
        $scope.$apply(function(){
          console.log('here');

          item.id = Utils.uuid();
          $scope.items.push(item);
        });
      }
      $('#itemsFile').val('');



    }
    r.readAsText(f);




  };
};

module.exports = WorkflowBlocklyCtrl;

