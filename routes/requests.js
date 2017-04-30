// var http = require('http');
// var Contest = require('./models/contests');
// var User = require('./models/users');
//
// module.exports.getContests = function(gym, cb){
//   setInterval(function(){
//     // Assign the HTTP request host/path
//       request({
//          url: 'http://codeforces.com/api/contest.list?gym='+gym,
//          method: 'GET',
//         }, function(error, response, body) {
//            if (error) {
//              console.log('Error sending messages: ', error)
//            } else if (response.body.error) {
//              console.log('Error: ', response.body.error)
//            }
//            else{
//              obj = JSON.parse(body);
//              if(obj.status === 'OK'){
//                var array = obj.result;
//                var len = array.length, i;
//                for(i = 0; i < len; i++)
//                {
//                  var item = JSON.parse(array[i]);
//                  Contest.findOne({ conId : item.id } , function(err, con) {
//                   if(err)
//                   {
//                     con = new Contest();
//                     con.conId = item.id;
//                     con.div1 = item.name.indexOf("div1") != -1;
//                     con.div2 = item.name.indexOf("div2") != -1;
//                     con.gym = gym;
//                     con.rem24H = false;
//                     con.rem1H = false;
//                     con.sysTestSt = false;
//                     con.sysTestEnd = false;
//                     con.ratingCh = false;
//                   }
//                   User.find().forEach(function(err, user) {
//                    if(user.div1 && con.div1)
// sendTextMessage(user.fbId,'A new div1 contest is announced!
 // ' + item.name + ' will take place after '
// + (item.relativeTimeSeconds / 86400) + ' day(s)
 // ' + ((item.relativeTimeSeconds % 86400) / 3600) + ' hour(s) ' +
// (((item.relativeTimeSeconds % 86400) % 3600) / 60) + ' min(s) ';
//                     );
//                    else if(user.div2 && con.div2)
//  sendTextMessage(user.fbId,'A new div2 contest is
// announced! ' + item.name + ' will take place after '
//   + (item.relativeTimeSeconds / 86400) + ' day(s)
 // ' + ((item.relativeTimeSeconds % 86400) / 3600) + ' hour(s) ' +
//      (((item.relativeTimeSeconds % 86400) % 3600) / 60) + ' min(s) ';
//                     );
//                    else if(user.gym && con.gym)
//   sendTextMessage(user.fbId,'A new gym contest is announced! ' +
// item.name + ' will take place after '
//   + (item.relativeTimeSeconds / 86400) + ' day(s) ' +
// ((item.relativeTimeSeconds % 86400) / 3600) + ' hour(s) ' +
//   (((item.relativeTimeSeconds % 86400) % 3600) / 60) + ' min(s) ';
//                     );
//                    if(!con.rem24H && item.relativeTimeSeconds >= -86400000){
//                       con.rem24H = true;
//                       sendTextMessage(user.fbId, 'Reminder: '
 // + item.name + ' will take place in 24 hours');
//                     }
//                    if(!con.rem1H && item.relativeTimeSeconds >= -3600000){
//                       con.rem1H = true;
//                       sendTextMessage(user.fbId, 'Reminder: '
 // + item.name + ' will take place in 1 hour');
//                     }
//                    if(!con.sysTestSt && item.phase === 'SYSTEM_TEST'){
//                       con.sysTestSt = true;
//                       sendTextMessage(user.fbId, 'System Testing
// for ' + con.name + ' has started!');
//                     }
//                     if(!con.sysTestEnd && item.phase === 'FINISHED'){
//                        con.sysTestEnd = true;
//                        monitorRating(item.id, con);
//                        sendTextMessage(user.fbId, 'System
// Testing for ' + con.name + ' has ended!');
//                      }
//                   }
//                   con.save(function(err) {
//                       if (err)
//                           console.log(err);
//                       else
//                           console.log({ message: 'Contest
// updated/created!' });
//                   });
//              }
//            }
//          }
//        }
//     });
//   }, 60000);
// };
//
//
// monitorRating = function(id, con){
//   var interv = setInterval(function(){
//     request({
//           url: 'http://codeforces.com/api/contest.ratingChanges?contestId='+id,
//           method: 'GET'
//         }, function(error, response, body) {
//           if (error) {
//             console.log('Error sending messages: ', error)
//           } else if (response.body.error) {
//             console.log('Error: ', response.body.error)
//           }
//           else {
//             obj = JSON.parse(body);
//             if(obj.status === 'FAILED') {
//             console.log('Rating changes are not available',error);
//             }
//             else {
//                 var array = obj.result;
//                 var len = array.length, i;
//                 for(i = 0; i < len; i++) {
//                   var item = JSON.parse(array[i]);
//     User.findOne({ cfHandle : item.handle } , function(err, user) {
//                    if(!err){
//   sendTextMessage(user.fbId, item.newRating > item.oldRating?
// 'Congrats! You earned ' + (item.newRating - item.oldRating) + '
// rating points')
//       :'You lost '+ (item.oldRating - item.newRating) + 'points! I know you
// can do it next time! Keep up the hard work :D');
//                    }
//                  }
//                }
//               clearInterval(interv);
//               con.ratingCh = true;
//             }
//         }
//     });
//   }, 60000);
// }
