module['exports'] = function vso_build (hook) {
  var params = hook.params

  var sourceBranch = ''
  var buildParams = '{ }'

  if (hook.req.headers['x-gitlab-event'] === 'Merge Request Hook') {
    // GitLab
    var action = params.object_attributes.action
    if (action === 'open' || (action === 'update' && params.object_attributes.oldrev !== '')) {
      sourceBranch = `refs/heads/${params.object_attributes.source_branch}`
    } else {
      hook.res.end('Skipped!')
    }
  } else if (hook.req.headers['x-event-key'] === 'pullrequest:created' || hook.req.headers['x-event-key'] === 'pullrequest:updated') {
    // Bitbucket
    sourceBranch = `refs/heads/${params.pullrequest.source.branch.name}`
  } else if (params.buildParams) {
    var token = hook.req.headers['x-git-token'] || ''
    if (token !== hook.env['vso_build_token']) {
      hook.res.end('Unauthorized!')
    }

    // Manual trigger
    buildParams = params.buildParams
    sourceBranch = `${params.sourceBranch}`
  } else {
    hook.res.end('Bad request source!')
  }

  console.log(`Building: ${sourceBranch}`)
  
  var url = `https://${params.account}.visualstudio.com/DefaultCollection/${params.project}/_apis/build/builds?api-version=2.0`
  var options = {
    url: url,
    json: true,
    body: {
      'definition': {
        'id': params.id
      },
      'sourceBranch': sourceBranch,
      'buildParams': buildParams
    }
  }

  var client = hook.sdk.createClient({})
  client.keys.checkAccess('hook::logs::read', function (err, h) {
    console.log(url)
    console.log(options)
  })

  // npm modules available, see: http://hook.io/modules
  var request = require('request')
  request.post(options, (err, res, body) => {
    if (err) {
      return hook.res.end(err.messsage)
    }

    hook.res.end(body)
  }).auth('hook.io', hook.env[`vso_build_${params.account.replace('-', '_')}_pat`], true)
}
