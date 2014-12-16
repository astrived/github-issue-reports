var fs = require('fs');
var _ = require('lodash');
var dateFormat = require('dateformat');
var GitHubApi = require('github');
var jade = require('jade');

var config = JSON.parse(fs.readFileSync('config.json', "UTF-8"));

var github = new GitHubApi({
  // required
  version: '3.0.0',
  // optional
  debug: true,
  protocol: 'https',
  timeout: 5000
});

github.authenticate({
  type: 'token',
  token: config.token
});

github.issues.repoIssues({repo: config.repo, user: config.owner, state: 'all'}, function (err, result) {
  var runDate = dateFormat();

  var issues = _.map(result, function (issue) {
    return {
      number: issue.number,
      title: issue.title,
      createdBy: issue.user.login,
      createdAt: issue.created_at,
      comments: issue.comments,
      closedAt: issue.closed_at,
      body: issue.body,
      state: issue.state
    }
  });

  var openIssues = _.filter(issues, function (issue) {
    return issue.state === 'open';
  });

  var closedIssues = _.filter(issues, function (issue) {
    return issue.state === 'closed';
  });

  console.log('====== Open Issues =======');
  console.log(openIssues);
  console.log('====== Closed Issues =======');
  console.log(closedIssues);


  var template = jade.compileFile('src/report.jade');
  var html = template({openIssues: openIssues, closedIssues: closedIssues, runDate: runDate});

  fs.writeFile(getReportName(config.repo, config.owner), html, function (err) {
    console.log(err);
  });
});

function getReportName(repo, owner) {
  return [
    'reports/',
    owner,
    '_',
    repo,
    '-',
    dateFormat(new Date(), 'yyyymdd-HHMMss'),
    '.html'
  ].join('');
}