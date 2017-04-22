/* 
 * dank.js
 * v0
 */

const apiURL = 'https://www.googleapis.com/youtube/v3/playlistItems';

var playlistId = 'PLUp3Q8z6bN4Y56BhCBsgXbSC9IW7DiX2r';
var maxResults = 50;
var apiKey = 'AIzaSyDR9ds4W7uUssLUn7IuV4IIGrrPwmJD3hE';
var apiPart = 'status%2C+contentDetails%2C+snippet';
var pageToken = '';
var fields = 'items(contentDetails%2FvideoId%2Ckind%2Csnippet(position%2Cthumbnails%2Fdefault%2Ctitle)%2Cstatus)%2CnextPageToken%2CpageInfo%2CprevPageToken';

var items = [];
var startAt = 0;

var player;

function constructRequestURL(playlistId, maxResults, apiKey, apiPart, pageToken, fields) {
    return apiURL + "?" + addQuery("part", apiPart) 
        + "&" + addQuery("maxResults", maxResults) 
        + "&" + addQuery("pageToken", pageToken) 
        + "&" + addQuery("playlistId", playlistId)
        + "&" + addQuery("fields", fields)
        + "&" + addQuery("key", apiKey);
}

function addQuery(key, value) {
    return key + "=" + value;
}

function playNext() {
    var currentVideo = items[startAt];
    if (currentVideo != undefined) {
        startAt++;
        if (currentVideo.status.privacyStatus == "private") {
            playNext();
        }
        var currentVideoId = currentVideo.contentDetails.videoId;
        if (player == undefined) {
            player = new YT.Player("ytplayer", {
                videoId: currentVideoId,
                events: {
                    'onReady': (function(event) {
                        // event.target.playVideo();
                    }),
                    'onStateChange': (function(event) {
                        if (event.data === 0) {
                            playNext();
                        }
                    }),
                    'onError': (function(event) {
                        console.error("Player error", event.data);
                        playNext();
                    })
                }
            });
        }else{
            player.loadVideoById(currentVideoId);
        }

    }else{
        console.error("filmy się skończyły :(");
    }
}

function restoreVideosFromCache() {
    items = JSON.parse(localStorage.items);
}

function afterVideosFetched() {
    localStorage.playlistId = playlistId;
    localStorage.items = JSON.stringify(items);
}

function onYouTubePlayerAPIReady() {
    function getAndAddVideos(pageToken) {
        var requestURL = constructRequestURL(playlistId, maxResults, apiKey, apiPart, pageToken, fields);
        get(requestURL).then(function(response) {
            var responseObject = JSON.parse(response);
            items = items.concat(responseObject["items"]);

            if (responseObject["nextPageToken"] != undefined) {
                getAndAddVideos(responseObject["nextPageToken"])
            }else{
                afterVideosFetched();
                playNext();
            }        
        }, function(error) {
            console.error(error);
        })
    }

    if (localStorage.playlistId != undefined 
        && localStorage.playlistId == playlistId) {
        restoreVideosFromCache();
        playNext();
    }else{
        getAndAddVideos(pageToken);
    }
}

function bootstrap() {
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/player_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onload = bootstrap