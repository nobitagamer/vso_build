module['exports'] = function vso_build (hook) {
  var params = hook.params
  var url = `https://${params.account}/DefaultCollection/${params.project}/_apis/build/builds?api-version=2.0`
  var options = {
    url: url,
    headers: {
      'Content-Type': 'application/json'
    },
    json: true,
    body: JSON.stringify({
      'definition': {
        'id': params.id
      },
      'sourceBranch': `refs/heads/${params.pullrequest.source.branch.name}`
    })
  }
  
  // npm modules available, see: http://hook.io/modules
  var request = require('request')
  request.post(options, (err, res, body) => {
    if (err) {
      return hook.res.end(err.messsage)
    }

    hook.res.end(body)
  }).auth('hook.io', hook.env[`vso_build_${params.account.replace('-', '_')}_pat`], true)
}
