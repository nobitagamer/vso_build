module['exports'] = function vso_build(hook) {
  var params = hook.params
  if (!params.pullrequest) {
    hook.res.end('Bad request source!')
  }
  
  var url = `https://${params.account}.visualstudio.com/DefaultCollection/${params.project}/_apis/build/builds?api-version=2.0`
  var options = {
    url: url,
    json: true,
    body: {
      'definition': {
        'id': params.id
      },
      'sourceBranch': `refs/heads/${params.pullrequest.source.branch.name}`
    }
  }

  var client = hook.sdk.createClient({});
  client.keys.checkAccess('hook::logs::read', function(err, h){
    console.log(url)
    console.log(options)
  });

  // npm modules available, see: http://hook.io/modules
  var request = require('request')
  request.post(options, (err, res, body) => {
    if (err) {
      return hook.res.end(err.messsage)
    }

    hook.res.end(body)
  }).auth('hook.io', hook.env[`vso_build_${params.account.replace('-', '_')}_pat`], true)
}