function removeFraudes(frauds, userid) {
    const tweetsContainer = document.getElementById("react-root"); 
    const observer = new MutationObserver((mutationsList, observer) => {
      mutationsList.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((addedNode) => {
            let tweets = addedNode.querySelectorAll('a[href*="/status/"]');
            tweets.forEach(function(tweet){
                if(tweet.href && !tweet.href.includes('/i/status') && (tweet.href.match(/\//g)||[]).length <= 5){
                    let parent = tweet.parentElement
                    let found = false
                    while (!found) {
                        if(parent.getAttribute("data-testid")=="cellInnerDiv"){
                            if(!parent.hasAttribute("was-tested")){
                                if(frauds.filter(x => x.tweet_id === tweet.href.split('/')[5]).length > 0){
                                    parent.style.display = "none"
                                }else{
                                    parent.setAttribute("was-tested", "true")
                                    let timeframe = parent.getElementsByTagName('time')[0].getAttribute("datetime")
                                    let divToModify = parent.querySelectorAll('[data-testid=User-Name]')[0].children[1].children[0]
                                    let toBeAdded = divToModify.children[1].cloneNode(true)
                                    let toBeAdded2 = divToModify.children[1].cloneNode(true)
                                    divToModify.appendChild(toBeAdded)
                                    let variables = {
                                        parent: parent,
                                        timeframe: timeframe,
                                        userid: userid,
                                        tweetid: tweet.href.split('/')[5]
                                    }
                                    toBeAdded2.children[0].innerHTML = "tap in ?"
                                    toBeAdded2.addEventListener('click', function(event){
                                        event.preventDefault()
                                        addTapIn(variables)
                                    });
                                    divToModify.appendChild(toBeAdded2)
                                }
                            }
                            found=true
                            
                        }
                        parent = parent.parentElement;
                    }
                }
            })
          });
        }
      });
    });
  
    var config = {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    };
    
    observer.observe(tweetsContainer, config);
}

function addTapIn(variables){
    fetch("https://feurtracker.fr/api/no_tap_in",
    {
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({user_id: variables.userid, tweet_id: variables.tweetid, tweeted_at: variables.timeframe})
    })
    variables.parent.style.display = "none"
}

function getRandomToken() {
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    return hex;
}

chrome.storage.sync.get('userid', function(items) {
    var userid = items.userid;
    if (userid) {
        useToken(userid);
    } else {
        userid = getRandomToken();
        chrome.storage.sync.set({userid: userid}, function() {
            useToken(userid);
        });
    }
    function useToken(userid) {
        fetch("https://feurtracker.fr/api/no_tap_in?user_id=" + userid).then(res =>
        res.json()).then(d => {
            removeFraudes(d, userid);
        })
    }
});