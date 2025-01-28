//* Constants
const BASE_URL = 'https://www.twitch.tv/'
const CLIENT_ID = 'ue6666qo983tsx6so1t0vnawi233wa' // old: kimne78kx3ncx6brgo4mv6wki5h1ko
const GQL_URL = 'https://gql.twitch.tv/gql#origin=twilight'
const PLATFORM = 'Twitch'
const PLATFORM_CLAIMTYPE = 14;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'

const REGEX_URL_VIDEO_DETAILS = /^https?:\/\/(www\.|m\.)?twitch\.tv\/videos\/(\d+)(\?.*)?$/

const REGEX_URL_CHANNEL = /^https?:\/\/(?:www\.|m\.)?twitch\.tv\/(?!login|signup|directory|p\/|search|settings|subscriptions|inventory|friends|help|jobs|partner|moderation|store|bits|subs|creators|ads|extensions|prime|giftcard|turbo)([a-zA-Z0-9-_]+)(?:\/.*)?$/;

const REGEX_URL_CHANNEL_CLIPS_FILTER = /^https?:\/\/(www\.|m\.)?twitch\.tv\/[a-zA-Z0-9_-]+\/clips\/?\?.*$/

const REGEX_URL_CLIP_DETAILS_LIST = [
    // Matches embedded clip URLs like https://clips.twitch.tv/embed?clip=clip-id
    /^https?:\/\/(www\.)?clips\.twitch\.tv\/embed\?clip=([a-zA-Z0-9_-]+)(&.*)?$/,

    // Matches URLs like https://clips.twitch.tv/clip-id
    /^https?:\/\/(www\.)?clips\.twitch\.tv\/([a-zA-Z0-9_-]+)(\?.*)?$/,

    // Matches URLs like https://www.twitch.tv/user-id/clip/clip-id or https://m.twitch.tv/user-id/clip/clip-id
    /^https?:\/\/(www\.|m\.)?twitch\.tv\/[a-zA-Z0-9_-]+\/clip\/([a-zA-Z0-9_-]+)(\?.*)?$/,

    // Matches URLs like https://www.twitch.tv/clip/clip-id or https://m.twitch.tv/clip/clip-id
    /^https?:\/\/(www\.|m\.)?twitch\.tv\/clip\/([a-zA-Z0-9_-]+)(\?.*)?$/
];

//* Global Variables
let CLIENT_SESSION_ID = ''
let CLIENT_VERSION = ''
let INTEGRITY = ''

var config = {}
let _settings = {};

//* Source
/**
 * The enable endpoint gets an integrity token. These integrity tokens must be passed into the stream playback access token endpoint. The integrity endpoint always returns a token but it is not always valid. Valid tokens work for 16 hours. Valid tokens are generated through a kasada challenge. The way to tell if a token is invalid is to try an endpoint and see if it fails.
 */
source.enable = function (conf, settings) {
    config = conf ?? {}
    _settings = settings ?? {};
    CLIENT_VERSION = `3e62b6e7-8e71-47f1-a2b3-0d661abad039`

    const resp = http.POST('https://gql.twitch.tv/integrity', '', {
        'User-Agent': USER_AGENT,
        Accept: '*/*',
        DNT: '1',
        Host: 'gql.twitch.tv',
        Origin: 'https://www.twitch.tv',
        Referer: 'https://www.twitch.tv/',
        'Client-Id': CLIENT_ID,
        'Client-Version': '3e62b6e7-8e71-47f1-a2b3-0d661abad039',
        'Client-Session-Id': '',
        'Client-Request-Id': '',
        'X-Device-Id': '',
    })

    const json = JSON.parse(resp.body)

    INTEGRITY = json.token

    return INTEGRITY
}
source.getHome = function () {
    return getHomePagerPopular({ cursor: null, page_size: 20 })
}
source.searchSuggestions = function (query) {
    const gql = {
        extensions: {
            persistedQuery: {
                sha256Hash: 'b71566f2c593dd906493b0ab2012e5626c7f277d3e435504d4454de2ff15788a',
                version: 1,
            },
        },
        query: 'query SearchTray_SearchSuggestions($queryFragment: String! $requestID: ID $withOfflineChannelContent: Boolean) { searchSuggestions(queryFragment: $queryFragment requestID: $requestID withOfflineChannelContent: $withOfflineChannelContent){ edges { ...searchSuggestionNode } tracking { modelTrackingID responseID } } } fragment searchSuggestionNode on SearchSuggestionEdge { node { content { __typename ... on SearchSuggestionChannel { id isLive isVerified login profileImageURL(width: 50) user { id stream { id game { id } } } } ... on SearchSuggestionCategory { id boxArtURL(width: 30 height: 40) } } matchingCharacters { start end } id text } }',
        operationName: 'SearchTray_SearchSuggestions',
        variables: {
            queryFragment: query,
            requestID: '',
            skipSchedule: false,
        },
    }

    /** @type {import("./types.d.ts").SearchSuggestionsResponse} */
    const json = callGQL(gql)

    return json.data.searchSuggestions.edges.map((edge) => edge.node.text)
}
source.getSearchCapabilities = () => {
    return { types: [Type.Feed.Mixed], sorts: [], filters: [] }
}
source.search = function (query, type, order, filters) {
    return getSearchPagerAll({ q: query })
}
source.getSearchChannelContentsCapabilities = function () {
    return { types: [Type.Feed.Mixed], sorts: [Type.Order.Chronological], filters: [] }
}
// not in twitch
source.searchChannelContents = function (channelUrl, query, type, order, filters) {
    return []
}
source.searchChannels = function (query) {
    return getSearchPagerChannels({ q: query, page_size: 20, results_returned: 0, cursor: null })
}
source.isChannelUrl = function (url) {
    return isChannelUrl(url);
};
source.getChannel = function (url) {
     
    const login = extractChannelId(url);

    const gql = [
        {
            query: 'query ChannelRoot_AboutPanel($channelLogin: String! $skipSchedule: Boolean!) { currentUser { id login } user(login: $channelLogin) { id description displayName isPartner primaryColorHex profileImageURL(width: 300) followers { totalCount } channel { id socialMedias { ...SocialMedia } schedule @skip(if: $skipSchedule) { id nextSegment { id startAt hasReminder } } } lastBroadcast { id game { id displayName } } primaryTeam { id name displayName } videos(first: 30 sort: TIME type: ARCHIVE) { edges { ...userBioVideo } } } } fragment userBioVideo on VideoEdge { node { id game { id displayName } status } } fragment SocialMedia on SocialMedia { id name title url }',
            operationName: 'ChannelRoot_AboutPanel',
            variables: {
                channelLogin: login,
                skipSchedule: false,
            },
            extensions: {
                persistedQuery: {
                    sha256Hash: '6089531acef6c09ece01b440c41978f4c8dc60cb4fa0124c9a9d3f896709b6c6',
                    version: 1,
                },
            },
        },
        {
            query: '#import "./query-channel-with-home-prefs-fragment.gql" query ChannelShell($login: String!) { userOrError: userResultByLogin(login: $login) { ...coreChannelWithHomePrefsFragment ... on UserDoesNotExist { userDoesNotExist: key reason } ... on UserError { userError: key } } }',
            operationName: 'ChannelShell',
            variables: {
                login: login,
            },
            extensions: {
                persistedQuery: {
                    sha256Hash: '580ab410bcd0c1ad194224957ae2241e5d252b2c5173d8e0cce9d32d5bb14efe',
                    version: 1,
                },
            },
        },
    ]

    const json = callGQL(gql)

    /** @type {import("./types.d.ts").ChannelAboutResponse} */
    const user_resp = json[0]
    const user = user_resp.data.user

    /** @type {import("./types.d.ts").ChannelShellResponse} */
    const shell_resp = json[1]
    const shell = shell_resp.data.userOrError

    return new PlatformChannel({
        id: new PlatformID(PLATFORM, user.id, config.id, PLATFORM_CLAIMTYPE),
        name: user.displayName,
        thumbnail: user.profileImageURL,
        banner: shell.bannerImageURL,
        subscribers: user.followers.totalCount,
        description: user.description,
        url: BASE_URL + login,
        links: user.channel.socialMedias.map((social) => social.url),
    })
}
source.getChannelContents = function (url) {
    return getChannelPager({ url, page_size: 20, VideoCursor: null })
}

source.getChannelTemplateByClaimMap = () => {
    return {
        //SoundCloud
        14: {
            0: BASE_URL + "{{CLAIMVALUE}}"
        }
    };
};

source.isContentDetailsUrl = function (url) {
    // https://www.twitch.tv/user (for livestreams) or https://www.twitch.tv/videos/123456789 or clips
    return (isChannelUrl(url) || isVideoUrl(url) || isTwitchClipDetailsUrl(url)) && !REGEX_URL_CHANNEL_CLIPS_FILTER.test(url);
}
source.getContentDetails = function (url) {
    if (url.includes('/video/') || url.includes('/videos/')) {
        return getSavedVideo(url)
    }  else if(isTwitchClipDetailsUrl(url)) { 
        return getClippedVideo(url);
    }
    else if(!url.includes('/clips?')) { 
        return getLiveVideo(url)
    }
}
source.getUserSubscriptions = function () {
    const gql = {
        "operationName": "ChannelFollows",
        "variables": {
            "limit": 100,
            "order": "DESC"
        },
        "extensions": {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "eecf815273d3d949e5cf0085cc5084cd8a1b5b7b6f7990cf43cb0beadf546907"
            }
        }
    };

    /** @type {import("./types.d.ts").PersonalSectionsFollowedResponse} */
    const json = callGQL(gql, true)
    console.log("json", json)

    const user = json.data.user;
    if (!user) {
        throw new ScriptException('Authentication Failed')
    }

    return user.follows.edges.map((e) => BASE_URL + e.node.login)
}

function getClippedVideo(url) {
    
    const clipSlug = extractTwitchClipSlug(url);

    const gql1 = [
        {
            "operationName": "VideoAccessToken_Clip",
            "variables": {
                "platform": "web",
                "slug": clipSlug
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "6fd3af2b22989506269b9ac02dd87eb4a6688392d67d94e41a6886f1e9f5c00f"
                }
            }
        },
        {
            "operationName": "ShareClipRenderStatus",
            "variables": {
                "slug": clipSlug
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "f130048a462a0ac86bb54d653c968c514e9ab9ca94db52368c1179e97b0f16eb"
                }
            }
        },
    ];

    const gqlResponses = callGQL(gql1, true);

    const clip = gqlResponses[1]?.data?.clip;

    const qualities = gqlResponses[0]?.data?.clip?.videoQualities ?? [];

    const sources = qualities.map(quality => {
        const sourceUrl = `${quality.sourceURL}?sig=${clip.playbackAccessToken.signature}&token=${encodeURIComponent(clip.playbackAccessToken.value)}`
        return new VideoUrlSource({ 
            name: `${quality.quality}p`, 
            duration: clip.durationSeconds, 
            url: sourceUrl,
            width: parseInt(quality.quality),
            container: "video/mp4"
        });  
    })

    return new PlatformVideoDetails({
        id: new PlatformID(PLATFORM, clipSlug, config.id),
        name: clip.title,
        thumbnails: new Thumbnails([new Thumbnail(clip.thumbnailURL, 0)]),
        author: new PlatformAuthorLink(
            new PlatformID(PLATFORM, clip.broadcaster.id, config.id, PLATFORM_CLAIMTYPE),
            clip.broadcaster.displayName,
            `${BASE_URL}${clip.broadcaster.login}`,
            clip.broadcaster.profileImageURL
        ),
        uploadDate: parseInt(new Date(clip.createdAt).getTime() / 1000),
        duration: clip.durationSeconds,
        viewCount: clip.viewCount,
        url: url,
        isLive: false,
        description: `${clip.game.displayName}\nClipped by ${clip.curator.displayName}`,
        video: new VideoSourceDescriptor(sources),
    })
}

/**
 * Returns a saved video
 * @param {string} url
 * @returns {PlatformVideoDetails}
 */
function getSavedVideo(url) {
    // get whatever is after the last slash in twitch.tv/videos/____/
    const id = extractTwitchVideoId(url)

    // query as written: '# This query name is VERY IMPORTANT. # # There is code in twilight-apollo to split links such that # this query is NOT batched in an effort to retain snappy TTV. query PlaybackAccessToken($login: String! $isLive: Boolean! $vodID: ID! $isVod: Boolean! $playerType: String!) { streamPlaybackAccessToken(channelName: $login params: {platform: "web" playerBackend: "mediaplayer" playerType: $playerType}) @include(if: $isLive) { value signature } videoPlaybackAccessToken(id: $vodID params: {platform: "web" playerBackend: "mediaplayer" playerType: $playerType}) @include(if: $isVod) { value signature } }'
    const gql1 = [
        {
            extensions: {
                persistedQuery: {
                    sha256Hash: '0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712',
                    version: 1,
                },
            },
            operationName: 'PlaybackAccessToken',
            variables: {
                isLive: false,
                isVod: true,
                login: '',
                playerType: 'site',
                vodID: id,
            },
            query: 'query PlaybackAccessToken($login: String! $isLive: Boolean! $vodID: ID! $isVod: Boolean! $playerType: String!) { streamPlaybackAccessToken(channelName: $login params: {platform: "web" playerBackend: "mediaplayer" playerType: $playerType}) @include(if: $isLive) { value signature } videoPlaybackAccessToken(id: $vodID params: {platform: "web" playerBackend: "mediaplayer" playerType: $playerType}) @include(if: $isVod) { value signature } }',
        },
        {
            extensions: {
                persistedQuery: {
                    sha256Hash: 'cf1ccf6f5b94c94d662efec5223dfb260c9f8bf053239a76125a58118769e8e2',
                    version: 1,
                },
            },
            operationName: 'ChannelVideoCore',
            variables: {
                videoID: id,
            },
            query: '#import "./query-channel-fragment.gql" query ChannelVideoCore($videoID: ID!) { video(id: $videoID) { id owner { ...coreChannelFragment } } }',
        },
    ]

    const json1 = callGQL(gql1, true)

    /** @type {import("./types.d.ts").PlaybackAccessTokenResponse} */
    const hls_json = json1[0]

    /** @type {import("./types.d.ts").ChannelVideoCoreResponse} */
    const channel_video_core = json1[1]
    const cvc = channel_video_core.data.video

    const spat = hls_json.data.videoPlaybackAccessToken

    const hls_url = `https://usher.ttvnw.net/vod/${id}.m3u8?acmb=e30=&allow_source=true&fast_bread=true&p=&play_session_id=&player_backend=mediaplayer&playlist_include_framerate=true&reassignments_supported=true&sig=${spat.signature}&supported_codecs=avc1&token=${encodeURIComponent(spat.value)}&transcode_mode=vbr_v1&cdm=wv&player_version=1.20.0`

    checkHLS(hls_url)

    const sources = [new HLSSource({ name: 'source', duration: 0, url: hls_url })]

    const gql2 = [
        {
            extensions: {
                persistedQuery: {
                    sha256Hash: '49b5b8f268cdeb259d75b58dcb0c1a748e3b575003448a2333dc5cdafd49adad',
                    version: 1,
                },
            },
            operationName: 'VideoMetadata',
            variables: {
                channelLogin: cvc.owner.login,
                videoID: id,
            },
            query: 'fragment videoMetadataUser on User { id } fragment videoMetadataVideo on Video { id title description previewThumbnailURL(height: 240 width: 360) createdAt viewCount publishedAt lengthSeconds broadcastType owner { id login displayName } game { id boxArtURL name displayName } } query VideoMetadata($channelLogin: String! $videoID: ID!) { user(login: $channelLogin) { id primaryColorHex isPartner profileImageURL(width: 140) lastBroadcast { id startedAt } } currentUser { ...videoMetadataUser } video(id: $videoID) { ...videoMetadataVideo } }',
        },
    ]

    const json2 = callGQL(gql2)

    /** @type {import("./types.d.ts").VideoMetadataResponse}*/
    const video_metadata = json2[0]

    const vm = video_metadata.data

    return new PlatformVideoDetails({
        id: new PlatformID(PLATFORM, id, config.id),
        name: vm.video.title,
        thumbnails: new Thumbnails([new Thumbnail(vm.video.previewThumbnailURL, 0)]),
        author: new PlatformAuthorLink(
            new PlatformID(PLATFORM, cvc.owner.id, config.id, PLATFORM_CLAIMTYPE),
            cvc.owner.login,
            BASE_URL + cvc.owner.login,
            cvc.owner.profileImageURL
        ),
        uploadDate: parseInt(new Date(vm.video.publishedAt).getTime() / 1000),
        duration: vm.video.lengthSeconds,
        viewCount: vm.video.viewCount,
        url: url,
        isLive: false,
        description: vm.video.description !== null ? vm.video.description : '',
        video: new VideoSourceDescriptor(sources),
    })
}

/**
 * Returns a live video
 * @param {string} url
 * @param {boolean} video_details
 * @returns {PlatformVideoDetails | PlatformVideo}
 */
function getLiveVideo(url, video_details = true) {
    // get whatever is after the last slash in twitch.tv/_____/
    const login = extractChannelId(url);
    
    const gql_for_metadata = [
        {
            operationName: 'StreamMetadata',
            query: 'query StreamMetadata($channelLogin: String!) { user(login: $channelLogin) { id primaryColorHex isPartner profileImageURL(width: 70) primaryTeam { id name displayName } squadStream { id members { id } status } channel { id chanlets { id } } lastBroadcast { id title } stream { id type createdAt game { id name } } } }',
            variables: {
                channelLogin: login,
            },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash: 'a647c2a13599e5991e175155f798ca7f1ecddde73f7f341f39009c14dbf59962',
                },
            },
        },
        {
            query: 'query UseViewCount($channelLogin: String!) { user(login: $channelLogin) { id stream { id viewersCount } } }',
            operationName: 'UseViewCount',
            variables: {
                channelLogin: login,
            },
            extensions: {
                persistedQuery: {
                    sha256Hash: '00b11c9c428f79ae228f30080a06ffd8226a1f068d6f52fbc057cbde66e994c2',
                    version: 1,
                },
            },
        },
        {
            extensions: {
                persistedQuery: {
                    sha256Hash: '639d5f11bfb8bf3053b424d9ef650d04c4ebb7d94711d644afb08fe9a0fad5d9',
                    version: 1,
                },
            },
            query: 'query UseLive($channelLogin: String!) { user(login: $channelLogin) { id login stream { id createdAt } }',
            operationName: 'UseLive',
            variables: {
                channelLogin: login,
            },
        },
        {
            extensions: {
                persistedQuery: {
                    sha256Hash: '0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712',
                    version: 1,
                },
            },
            operationName: 'PlaybackAccessToken',
            variables: {
                isLive: true,
                isVod: false,
                login: login,
                playerType: 'frontpage',
                vodID: '',
            },
            query: 'query PlaybackAccessToken($login: String! $isLive: Boolean! $vodID: ID! $isVod: Boolean! $playerType: String!) { streamPlaybackAccessToken(channelName: $login params: {platform: "web" playerBackend: "mediaplayer" playerType: $playerType}) @include(if: $isLive) { value signature } videoPlaybackAccessToken(id: $vodID params: {platform: "web" playerBackend: "mediaplayer" playerType: $playerType}) @include(if: $isVod) { value signature } }',
        },
    ]
    const json = callGQL(gql_for_metadata, true)

    /** @type {import("./types.d.ts").StreamMetadataResponse}*/
    const stream_metadata = json[0]
    /** @type {import("./types.d.ts").ViewCountResponse}*/
    const view_count = json[1]
    /** @type {import("./types.d.ts").UseLiveResponse}*/
    const use_live = json[2]
    /** @type {import("./types.d.ts").PlaybackAccessTokenResponse} */
    const playback_access_token = json[3]

    const sm = stream_metadata.data.user
    const vc = view_count.data.user
    const ul = use_live.data.user

    if (ul?.stream === null) {
        // log('Channel is not live:' + JSON.stringify(use_live, null, 2))
        throw new UnavailableException('Channel is not live')
    }

    const spat = playback_access_token.data.streamPlaybackAccessToken

    const hls_url = `https://usher.ttvnw.net/api/channel/hls/${login}.m3u8?acmb=e30=&allow_source=true&fast_bread=true&p=&play_session_id=&player_backend=mediaplayer&playlist_include_framerate=true&reassignments_supported=true&sig=${spat.signature}&supported_codecs=avc1&token=${encodeURIComponent(spat.value)}&transcode_mode=vbr_v1&cdm=wv&player_version=1.20.0`

    checkHLS(hls_url)

    const hls_source = new HLSSource({ name: 'live', duration: 0, url: hls_url })

    const pv = new PlatformVideo({
        id: new PlatformID(PLATFORM, sm.id, config.id),
        name: sm.lastBroadcast.title,
        thumbnails: new Thumbnails([
            new Thumbnail(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-1280x720.jpg`, 720),
            new Thumbnail(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-854x480.jpg`, 480),
        ]),
        author: new PlatformAuthorLink(new PlatformID(PLATFORM, sm.channel.id, config.id, PLATFORM_CLAIMTYPE), login, url, sm.profileImageURL),
        uploadDate: parseInt(new Date(ul.stream.createdAt).getTime() / 1000),
        duration: 0,
        viewCount: vc.stream.viewersCount,
        url: url,
        shareUrl: url,
        isLive: true,
    })

    if (video_details) {
        return new PlatformVideoDetails({
            ...pv,
            description: '',
            video: new VideoSourceDescriptor([]),
            live: hls_source,
        })
    } else {
        return pv
    }
}
source.getComments = function (url) {
    return getCommentPager({ url: url, page: 1, page_size: 20 })
}
source.getSubComments = function (comment) {
    return new CommentPager([], false, {}) //Not implemented
}
source.getLiveChatWindow = function (url) {
    const login = extractChannelId(url);
    return {
        url: "https://www.twitch.tv/popout/" + login + "/chat",
        removeElements: [".stream-chat-header", ".chat-room__content > div:first-child"],
        removeElementsInterval: [".consent-banner"]
    };
}
source.getLiveEvents = function (url) {

    const login = extractChannelId(url);

    const gql = [
        {
            query: '#import "./query-channel-with-home-prefs-fragment.gql" query ChannelShell($login: String!) { userOrError: userResultByLogin(login: $login) { ...coreChannelWithHomePrefsFragment ... on UserDoesNotExist { userDoesNotExist: key reason } ... on UserError { userError: key } } }',
            operationName: 'ChannelShell',
            variables: {
                login: login,
            },
            extensions: {
                persistedQuery: {
                    sha256Hash: '580ab410bcd0c1ad194224957ae2241e5d252b2c5173d8e0cce9d32d5bb14efe',
                    version: 1,
                },
            },
        },
        {
            query: '#import "twilight/features/badges/models/badge-fragment.gql" #import "twilight/features/squad-stream/models/squad-stream-fragment.gql" query ChatList_Badges($channelLogin: String!) { badges { ...badge } user(login: $channelLogin) { id primaryColorHex broadcastBadges { ...badge } self { selectedBadge { ...badge } displayBadges { ...badge } } squadStream { ...squadStreamData } } }',
            extensions: {
                persistedQuery: {
                    sha256Hash: '86f43113c04606e6476e39dcd432dee47c994d77a83e54b732e11d4935f0cd08',
                    version: 1,
                },
            },
            operationName: 'ChatList_Badges',
            variables: {
                channelLogin: login,
            },
        },
        /*
        {
            query: '#import "twilight/features/message/fragments/message-content-fragment.gql" query MessageBufferChatHistory($channelLogin: String! $channelID: ID) { channel(name: $channelLogin) { id recentChatMessages { ...historicalMessage } } } fragment chatHistoryParentMessage on Message { id content { text } deletedAt sender { id login displayName } } fragment historicalMessage on Message { id deletedAt sentAt content { ...messageContent } parentMessage { ...chatHistoryParentMessage } sender { id login chatColor displayName __typename } senderBadges(channelID: $channelID) { setID version id } }',
            extensions: {
                persistedQuery: {
                    sha256Hash: '432ef3ec504a750d797297630052ec7c775f571f6634fdbda255af9ad84325ae',
                    version: 1,
                },
            },
            operationName: 'MessageBufferChatHistory',
            variables: {
                channelLogin: login,
            },
        }*/
    ]

    const json = callGQL(gql)

    /** @type {import("./types.d.ts").ChannelShellResponse} */
    const ChannelShellResponse = json[0]
    const userOrError = ChannelShellResponse.data.userOrError

    /** @type {import("./types.d.ts").RecentChatsResponse} */
    //const RecentChatsResponse = json[2]
    const chats = []; /*RecentChatsResponse.data.channel.recentChatMessages.map(
        (chat) => new LiveEventComment(chat.sender.login, chat.content.text, '', chat.sender.chatColor)
    )*/

    /** @type {import("./types.d.ts").BadgeListResponse} */
    const BadgeListResponse = json[1]

    let badge_url_map = {}

    BadgeListResponse.data.badges.forEach((badge) => {
        badge_url_map[badge.setID] = badge.image2x
    })

    return new TwitchLiveEventPager(userOrError.id, login, chats, badge_url_map)
}

class TwitchLiveEventPager extends LiveEventPager {
    /**
     * @param {string} channelId
     * @param {string} channelName
     * @param {LiveEventComment[]} chats
     * @param {{[key: string]: string}} badge_url_map
     */
    constructor(channelId, channelName, chats, badge_url_map) {
        super([], true)
        const me = this

        this.channelId = channelId
        this.channelName = channelName
        this.events = [...chats]
        this.emojis = {}
        this.lastFetch = new Date().getTime()

        let socket_irc = http.socket('wss://irc-ws.chat.twitch.tv', {}, false)
        socket_irc.connect(
            {
                open() {
                    const justin_fan_number = Math.floor(Math.random() * 9999)
                    const jf = `justinfan${justin_fan_number}`
                    socket_irc.send('CAP REQ :twitch.tv/tags')
                    socket_irc.send('PASS SCHMOOPIIE')
                    socket_irc.send(`NICK ${jf}`)
                    socket_irc.send(`USER ${jf} 8 * :${jf}`)
                    socket_irc.send(`JOIN #${me.channelName}`)

                    if (IS_TESTING) console.log(`Sent JOIN #${me.channelName}`)
                },
                message(msg) {
                    if (((new Date()).getTime() - me.lastFetch) / 1000 > 10) socket_irc.close()

                    if (!msg.startsWith('@badge-info')) return

                    if (msg.includes(';msg-id=')) {
                        const msg_id = msg.match(/;msg-id=([^;]+);/)[1]
                        let months_param, display_name_param
                        if (msg_id === 'sub' || msg_id === 'resub') {
                            months_param = 'msg-param-cumulative-months'
                            display_name_param = 'display-name'
                        } else {
                            months_param = 'msg-param-gift-months'
                            display_name_param = 'msg-param-recipient-display-name'
                        }
                        const regex = new RegExp(`;${months_param}=(\\d+);.*;${display_name_param}=([^;]+);.*;system-msg=([^;]+);`)
                        const result = regex.exec(msg)
                        const months = parseInt(result[1])
                        const display_name = result[2]
                        const system_message = result[3].replace(/\\s/g, ' ')
                        me.events.push(new LiveEventDonation(months + ' Months', display_name, system_message, ''))
                        return
                    }

                    //TODO: Make this a separate function
                    const parsedMessage = parseEmojiMessage(me.channelName, msg)
                    let newEmojis = {}
                    for (let key of Object.keys(parsedMessage.emojis)) {
                        if (!me.emojis[key]) {
                            me.emojis[key] = parsedMessage.emojis[key]
                            newEmojis[key] = parsedMessage.emojis[key]
                        }
                    }

                    const nameMatch = msg.match(/;display-name=([^;]+);/);
                    const name = (nameMatch && nameMatch.length >= 2) ? nameMatch[1] : null;
                    const colorMatch = msg.match(/;color=([^;]+);/);
                    const color = (colorMatch && colorMatch.length >= 2) ? colorMatch[1] : null;
                    const badges = msg.match(/;badges=([^;]+);/)
                    const badge_array = (badges && badges.length >= 2) ? badges[1].split(',') : [];
                    badge_array.forEach((badge) => {
                        newEmojis[badge] = badge_url_map[badge]
                    })

                    if (Object.keys(newEmojis).length > 0)
                        me.events.push(new LiveEventEmojis(newEmojis))

                    if (name)
                        me.events.push(new LiveEventComment(name, parsedMessage.msg, '', color, badge_array))
                    else if (IS_TESTING)
                        console.log("Failed name/color: " + msg);
                },
            },
            false
        )
        let socket_pub_sub = http.socket('wss://pubsub-edge.twitch.tv/v1', {}, false)
        socket_pub_sub.connect({
            open() {
                socket_pub_sub.send(JSON.stringify({ type: 'LISTEN', nonce: '', data: { topics: [`video-playback-by-id.${me.channelId}`] } }))
                // socket_pub_sub.send(JSON.stringify({"type":"LISTEN","nonce":"","data":{"topics":[`channel-bits-events-v2.${context.channel_id}`]}}))
                socket_pub_sub.send(JSON.stringify({ type: 'LISTEN', nonce: '', data: { topics: [`raid.${me.channelId}`] } }))
                // socket_pub_sub.send(JSON.stringify({"type":"LISTEN","nonce":"","data":{"topics":[`channel-subscribe-events-v1.${context.channel_id}`]}}))
                if (IS_TESTING) console.log(`Sent LISTEN to ${me.channelId}`)
            },
            message(msg) {
                if (((new Date()).getTime() - me.lastFetch) / 1000 > 10) socket_pub_sub.close()

                const json = JSON.parse(msg)
                if (json.type === 'MESSAGE') {
                    // {"type":"MESSAGE","data":{"topic":"video-playback-by-id.156037856","message":"{\"type\":\"viewcount\",\"server_time\":1686777651.803572,\"viewers\":40549}"}}
                    const data = JSON.parse(json.data.message)
                    const messageType = json.data.topic.split('.')[0]
                    switch (messageType) {
                        case 'video-playback-by-id':
                            me.events.push(new LiveEventViewCount(data.viewers))
                            break
                        case 'channel-bits-events-v2':
                            me.events.push(new LiveEventDonation(parseFloat(data.badge_tier) + ' Bits', data.user_name, data.chat_message, null))
                            break
                        case 'raid':
                            me.events.push(new LiveEventRaid(data.display_name, data.viewer_count))
                            break
                        case 'channel-subscribe-events-v1':
                            me.events.push(
                                new LiveEventDonation(parseFloat(data.cumulative_months) + ' Months', data.display_name, data.sub_message.message, null)
                            )
                            break
                    }
                }
            },
            closed() {
                this.hasMore = false
            },
        })
    }

    nextPage() {
        this.lastFetch = new Date().getTime()
        this.results = [...this.events]
        this.events = []
        return this
    }
}

// @badge-info=;badges=glitchcon2020/1;client-nonce=4aaf7de413ec6cd4ca3cfd342590c53b;color=#0053D5;display-name=bungerlove;emotes=25:10-14;first-msg=0;flags=;id=dd35695a-20f6-430e-a8fa-6ec284c5a02c;mod=0;returning-chatter=0;room-id=21841789;subscriber=0;tmi-sent-ts=1689265271382;turbo=0;user-id=161748597;user-type= :bungerlove!bungerlove@bungerlove.tmi.twitch.tv PRIVMSG #nmplol :prime sub Kappa
// @badge-info=;badges=moments/1;color=#FF0000;display-name=blob___fish;emotes=33:36-43,45-52,67-74/133468:54-65,76-87,89-100/emotesv2_e02650251d204198923de93a0c62f5f5:102-110;first-msg=0;flags=;id=fdd7aafe-2f3a-4600-b5da-a8441e83f682;mod=0;returning-chatter=0;room-id=71092938;subscriber=0;tmi-sent-ts=1689266506402;turbo=0;user-id=737776278;user-type= :blob___fish!blob___fish@blob___fish.tmi.twitch.tv PRIVMSG #xqc :@xqc WHAT HAPPENS TO YOUR GAMESHOW? DansGame DansGame ItsBoshyTime DansGame ItsBoshyTime ItsBoshyTime PotFriend
function parseEmojiMessage(channelName, msg) {
    //TODO: Remove redundant channelName
    // write a regex to select the message content
    const regex = new RegExp(`PRIVMSG #${channelName} :(.*)`)
    const content = msg.match(regex)[1]
    const newEmojis = {}
    let reconstructed = ''
    if (!msg.includes(';emotes=;')) {
        const regex = /;emotes=([^;]+);/
        const result = msg.match(regex)[1]
        const emote_ranges = result.split('/').map((e) => {
            const split = e.split(':')
            return {
                id: split[0],
                ranges: split[1].split(',').map((r) => {
                    const split = r.split('-')
                    return {
                        start: parseInt(split[0]),
                        end: parseInt(split[1]),
                    }
                }),
            }
        })
        /** @type {{id: string, start: number, end: number}[]} */
        const ranges = emote_ranges.flatMap((emote) => emote.ranges.map((range) => ({ emote: emote.id, ...range }))).sort((a, b) => a.start - b.start)
        for (let i = 0; i < content.length; i++) {
            if (ranges.length > 0 && ranges[0].start === i) {
                newEmojis['emote_' + ranges[0].emote] = `https://static-cdn.jtvnw.net/emoticons/v2/${ranges[0].emote}/default/dark/2.0`
                reconstructed += `__${'emote_' + ranges[0].emote}__`
                i = ranges[0].end
                ranges.shift()
            } else {
                reconstructed += content[i]
            }
        }
    } else {
        reconstructed = content
    }
    return {
        emojis: newEmojis,
        msg: reconstructed.trim(),
    }
}

//* Internals
/**
 * Posts to GQL_URL with the gql query. Includes relevant headers.
 * @param {Object} gql the gql query object to be stringified and sent
 * @param {boolean} use_authenticated if true, will use the authenticated headers
 * @param {boolean} parse if true, will parse the response as json and check for errors
 * @returns {string | Object} the response body as a string or the parsed json object
 * @throws {ScriptException}
 */
function callGQL(gql, use_authenticated = false, parse = true) {
    // log("Integrity: " + INTEGRITY)
    const resp = http.POST(
        GQL_URL,
        JSON.stringify(gql),
        {
            'User-Agent': USER_AGENT,
            Accept: '*/*',
            DNT: '1',
            Host: 'gql.twitch.tv',
            Origin: 'https://www.twitch.tv',
            Referer: 'https://www.twitch.tv/',
            'Client-Id': CLIENT_ID,
            // "Client-Version": CLIENT_VERSION,
            // "Client-Session-Id": CLIENT_SESSION_ID,
            'Client-Integrity': INTEGRITY,
            // "X-Device-Id": '',
            // "Device-Id": '',
        },
        use_authenticated
    )

    if (resp.code !== 200) {
        throw new ScriptException(`GQL returned ${resp.code}: ${resp.body}`)
    }

    if (!parse) return resp.body

    const json = JSON.parse(resp.body)

    // check for errors in the case of different lengths cause json can be array or single object
    if (!json.length && json.errors) {
        throw new ScriptException(`GQL returned errors: ${JSON.stringify(json.errors)}`)
    }

    if (json.length) {
        for (const obj of json) {
            if (obj.errors) {
                throw new ScriptException(`GQL returned errors: ${JSON.stringify(obj.errors)}`)
            }
        }
    }

    return json
}

/**
 * Checks if the HLS stream is available
 * @param {string} url
 * @returns {void}
 * @throws {UnavailableException}
 */
function checkHLS(url) {
    const resp = http.GET(url, { 'User-Agent': USER_AGENT })
    if (!resp.isOk) {
        throw new UnavailableException('This content is restricted to subscribers')
    }
}

//* Pagers
/**
 * Gets a pager for the home pager
 * @param {import("./types.d.ts").HomeContext} context
 * @returns {HomePagerPopular}
 */
function getHomePagerPopular(context) {
    let gql = {
        extensions: {
            persistedQuery: {
                sha256Hash: 'b32fa28ffd43e370b42de7d9e6e3b8a7ca310035fdbb83932150443d6b693e4d',
                version: 1,
            },
        },
        query: '#import "twilight/pages/directory-popular/queries/popular-streams-edge.gql" query BrowsePage_Popular( $limit: Int $cursor: Cursor $platformType: PlatformType $options: StreamOptions $sortTypeIsRecency: Boolean! $imageWidth: Int = 50 ) { streams( first: $limit after: $cursor platformType: $platformType options: $options ) { edges { ...browsePagePopularStreamsWithTagsEdge } pageInfo { hasNextPage } } }',
        operationName: 'BrowsePage_Popular',
        variables: {
            imageWidth: 50,
            limit: context.page_size,
            options: {
                broadcasterLanguages: ['EN'],
                freeformTags: null,
                includeRestricted: ['SUB_ONLY_LIVE'],
                recommendationsContext: {
                    platform: 'web',
                },
                requestID: 'JIRA-VXP-2397',
                sort: 'RELEVANCE',
                tags: [],
            },
            platformType: 'all',
            sortTypeIsRecency: false,
        },
    }
    if (context.cursor) gql.variables.cursor = context.cursor

    /** @type {import("./types.d.ts").BrowsePopularResponse}*/
    const json = callGQL(gql) //! to use authentication, requires valid integrity
    // const json = callGQL(gql, true)

    const streams = json.data.streams.edges.map((s) => {
        let n = s.node
        return new PlatformVideo({
            id: new PlatformID(PLATFORM, n.id, config.id),
            name: n.title,
            thumbnails: new Thumbnails([new Thumbnail(n.previewImageURL, 0)]),
            author: new PlatformAuthorLink(
                new PlatformID(PLATFORM, n.broadcaster.id, config.id, PLATFORM_CLAIMTYPE),
                n.broadcaster.login,
                BASE_URL + n.broadcaster.login,
                n.broadcaster.profileImageURL
            ),
            uploadDate: parseInt(new Date().getTime() / 1000),
            duration: 0,
            viewCount: n.viewersCount,
            url: BASE_URL + n.broadcaster.login,
            shareUrl: BASE_URL + n.broadcaster.login,
            isLive: true,
        })
    })

    context.cursor = json.data.streams.edges[json.data.streams.edges.length - 1].cursor

    return new HomePagerPopular(streams, json.data.streams.pageInfo.hasNextPage, context)
}

/**
 * Gets a pager for the homepage
 * @param {import("./types.d.ts").HomeContext} context the context params
 * @returns {HomePagerPersonalSections} returns the homepage pager
 */
function getHomePagerPersonalSections(context) {
    const gql = {
        query: 'query PersonalSections( $input: PersonalSectionInput! $creatorAnniversariesFeature: Boolean! ) { personalSections(input: $input) { type title { ...personalSectionTitle } items { ...personalSectionItem } } } fragment personalSectionTitle on PersonalSectionTitle { localizedFallback localizedTokens { ... on PersonalSectionTextToken { value } ... on User { id login displayName } } } fragment personalSectionItem on PersonalSectionChannel { trackingID promotionsCampaignID user { ...personalSectionItemUser } label content { ...personalSectionsStream } } fragment personalSectionItemUser on User { id login displayName profileImageURL(width: 70) primaryColorHex broadcastSettings { id title } channel @include(if: $creatorAnniversariesFeature) { id activeCreatorEventCelebration { id } } } fragment personalSectionsStream on Stream { id previewImageURL(width: 320 height: 180) broadcaster { id broadcastSettings { id title } } viewersCount game { id displayName name } type }',
        operationName: 'PersonalSections',
        variables: {
            creatorAnniversariesFeature: false,
            input: {
                recommendationContext: {
                    categoryName: null,
                    channelName: null,
                    clientApp: 'twilight',
                    lastCategoryName: null,
                    lastChannelName: null,
                    location: 'home',
                    pageviewContent: null,
                    pageviewContentType: null,
                    pageviewLocation: 'home',
                    pageviewMedium: null,
                    platform: 'web',
                    previousPageviewContent: null,
                    previousPageviewContentType: null,
                    previousPageviewLocation: null,
                    previousPageviewMedium: null,
                    referrerDomain: null,
                    viewportHeight: 640,
                    viewportWidth: 640,
                },
                sectionInputs: ['RECOMMENDED_SECTION'],
            },
        },
        extensions: {
            persistedQuery: {
                sha256Hash: '807e3cce07a1cef5c772bbc46c12ead2898edd043ad4dd2236707f6f7995769c',
                version: 1,
            },
        },
    }

    /** @type {import("./types.d.ts").PersonalSectionsResponse}*/
    const json = callGQL(gql, true)

    const initialStreams = json.data.personalSections[0].items.map((item) => personalSectionToPlatformVideo(item))

    return new HomePagerPersonalSections(context, initialStreams)
}

/**
 * Converts a twitch node to a platform video
 * @param {import("./types.d.ts").PersonalSection} ps the twitch stream node
 * @returns {PlatformVideo} returns the platform video
 * @throws {ScriptException}
 */
function personalSectionToPlatformVideo(ps) {
    return new PlatformVideo({
        id: new PlatformID(PLATFORM, ps.content.id, config.id),
        name: ps.content.broadcaster.broadcastSettings.title,
        thumbnails: new Thumbnails([new Thumbnail(ps.content.previewImageURL, 0)]),
        author: new PlatformAuthorLink(new PlatformID(PLATFORM, ps.user.id, config.id, PLATFORM_CLAIMTYPE), ps.user.displayName, BASE_URL + ps.user.login, ps.user.profileImageURL),
        uploadDate: parseInt(new Date().getTime() / 1000),
        duration: 0,
        viewCount: ps.content.viewersCount,
        url: BASE_URL + ps.user.login,
        shareUrl: BASE_URL + ps.user.login,
        isLive: true,
    })
}

/**
 * Gets a comment pager
 * @param {import("./types").HomeContext & {url: string; id: number|null}} context the comment context
 * @returns {ExtendableCommentPager} returns the comment pager
 * @throws {ScriptException}
 */
function getCommentPager(context) {
    return new ExtendableCommentPager(context, [])
}

/**
 * Gets a channel pager
 * @param {import("./types.d.ts").URLContext} context the channel context
 * @returns {ChannelVideoPager} returns the channel pager
 * @throws {ScriptException}
 */
function getChannelPager(context) {
    // url format https://www.twitch.tv/qtcinderella/videos?filter=all&sort=time (query params may or may not be there)
    /** @type {string} */
    let login = extractChannelId(context.url)
    

    const gqlVideoOperationName = 'FilterableVideoTower_Videos';
    const gqlClipOperationName = 'ClipsCards__User';

    let gql = [{
        extensions: {
            persistedQuery: {
                sha256Hash: 'a937f1d22e269e39a03b509f65a7490f9fc247d7f83d6ac1421523e3b68042cb',
                version: 1,
            },
        },
        operationName: gqlVideoOperationName,
        variables: {
            broadcastType: null,
            channelOwnerLogin: login,
            cursor: context.VideoCursor,
            limit: context.page_size,
            videoSort: 'TIME',
        },
        query: '#import "twilight/features/video-preview-card/models/video-edge-fragment.gql" query FilterableVideoTower_Videos($channelOwnerLogin: String! $limit: Int $cursor: Cursor $broadcastType: BroadcastType $videoSort: VideoSort $options: VideoConnectionOptionsInput) { user(login: $channelOwnerLogin) { id videos(first: $limit after: $cursor type: $broadcastType sort: $videoSort options: $options) { edges { ...VideoEdge } pageInfo { hasNextPage } } } }',
    },
    {
        operationName: gqlClipOperationName,
        variables: {
            login: login,
            limit: 30,
            criteria: {
                filter: "ALL_TIME",
                shouldFilterByDiscoverySetting: true
            },
            cursor: context.ClipCursor
        },
        extensions: {
            persistedQuery: {
                version: 1,
                sha256Hash: "4eb8f85fc41a36c481d809e8e99b2a32127fdb7647c336d27743ec4a88c4ea44"
            }
        }
    }]

    if(context.videosHasNext === undefined) {
        context.videosHasNext = true;
    }

    if(context.clipsHasNext === undefined) {
        context.clipsHasNext = true;
    }

    if(_settings.shouldIncludeChannelClips === false) {
        context.clipsHasNext = false;
    }

    if(context.videosHasNext === false) {
        gql = gql.filter(g => g.operationName != gqlVideoOperationName)
    }
    
    if(context.clipsHasNext === false) {
        gql = gql.filter(g => g.operationName != gqlClipOperationName)
    }

    const response = callGQL(gql)

    let videosJson = [];
    let clipsJson = [];
    
    if(context.videosHasNext) {
        const index = response.findIndex(e => e.extensions.operationName == gqlVideoOperationName);
        videosJson = response[index];
    }
    
    if(context.clipsHasNext) {
        const index = response.findIndex(e => e.extensions.operationName == gqlClipOperationName);
        clipsJson = response[index];
    }

    const edges = videosJson?.data?.user?.videos?.edges ?? [];
    const clips = clipsJson?.data?.user?.clips?.edges ?? [];

    let videos = [...edges,...clips].map((edge) => {
        
        let owner;
        let contentUrl;

        if(edge.node.__typename == 'Clip') {
            owner = edge.node.broadcaster;
            contentUrl = `https://www.twitch.tv/${owner.login}/clip/${edge.node.slug}`            
        } else 
        {
            owner = edge.node.owner;
            contentUrl = BASE_URL + 'videos/' + edge.node.id;
        }

        const uploadDate = edge?.node?.publishedAt ?? edge?.node?.createdAt ?? "";
        const duration = edge?.node?.lengthSeconds ?? edge?.node?.durationSeconds ?? "";
        const thumbnail = edge?.node?.previewThumbnailURL ?? edge?.node?.thumbnailURL ?? "";

        return new PlatformVideo({
            id: new PlatformID(PLATFORM, edge.node.id, config.id),
            name: edge.node.title,
            thumbnails: new Thumbnails([new Thumbnail(thumbnail, 0)]),
            author: new PlatformAuthorLink(
                new PlatformID(PLATFORM, owner.id, config.id, PLATFORM_CLAIMTYPE),
                owner.displayName,
                BASE_URL + owner.login,
                owner.profileImageURL
            ),
            uploadDate: parseInt(new Date(uploadDate).getTime() / 1000),
            url: contentUrl,
            duration: duration,
            viewCount: edge.node.viewCount,
            isLive: false,
        })
    })

    if (context.VideoCursor === null) {
        // get the currently live stream
        try {
            const current_stream = getLiveVideo(BASE_URL + login, false)
            // remove first video
            videos = videos.slice(1)
            videos.unshift(current_stream)
        } catch (e) {
            log(e)
        }
    }

    if (edges.length > 0) {
        context.VideoCursor = edges[edges.length - 1].cursor
    }

    if (clips.length > 0) {
        context.ClipCursor = clips[clips.length - 1].cursor
    }
       
    context.videosHasNext = videosJson?.data?.user?.videos?.pageInfo?.hasNextPage ?? false;
    context.clipsHasNext = clipsJson?.data?.user?.clips?.pageInfo?.hasNextPage ?? false;
    const hasNext = context.videosHasNext || context.clipsHasNext;

    return new ChannelVideoPager(context, videos, hasNext)
}

/**
 * Gets a search pager
 * @param {import("./types.d.ts").SearchContext} context the query params
 * @returns {(PlatformVideo | PlatformChannel)[]} returns the search pager
 * @throws {ScriptException}
 */
function getSearchPagerAll(context) {
    const gql = {
        extensions: {
            persistedQuery: {
                sha256Hash: '6ea6e6f66006485e41dbe3ebd69d5674c5b22896ce7b595d7fce6411a3790138',
                version: 1,
            },
        },
        operationName: 'SearchResultsPage_SearchResults',
        variables: {
            query: context.q,
            options: null,
            requestID: '',
        },
        query: '#import "twilight/features/tags/models/freeform-tag-fragment.gql" #import "twilight/features/tags/models/tag-fragment.gql" query SearchResultsPage_SearchResults( $query: String! $options: SearchForOptions $requestID: ID ) { searchFor( userQuery: $query platform: "web" options: $options requestID: $requestID ) { channels { ...searchForChannelsFragment } channelsWithTag { ...searchForChannelsWithTagFragment } games { ...searchForGamesFragment } videos { ...searchForVideosFragment } relatedLiveChannels { ...relatedLiveChannelsFragment } } } fragment relatedLiveChannelsFragment on SearchForResultRelatedLiveChannels { edges { trackingID item { ...searchRelatedLiveChannelFragment } } score } fragment searchForGamesFragment on SearchForResultGames { cursor edges { trackingID item { ...searchForGameFragment ...searchForVideoFragment ...searchForUserFragment } } score totalMatches } fragment searchForChannelsFragment on SearchForResultUsers { cursor edges { trackingID item { ...searchForUserFragment ...searchForVideoFragment ...searchForGameFragment } } score totalMatches } fragment searchForChannelsWithTagFragment on SearchForResultUsers { cursor edges { trackingID item { ...searchForUserFragment ...searchForVideoFragment ...searchForGameFragment } } score totalMatches } fragment searchForVideosFragment on SearchForResultVideos { cursor edges { trackingID item { ...searchForVideoFragment ...searchForUserFragment ...searchForGameFragment } } score totalMatches } fragment searchRelatedLiveChannelFragment on User { id stream { id viewersCount previewImageURL(height: 112 width: 200) game { name id } broadcaster { id primaryColorHex login displayName broadcastSettings { id title } roles { isPartner } } } watchParty { session { id contentRestriction } } } fragment searchForGameFragment on Game { id name displayName boxArtURL(height: 120 width: 90) tags(tagType: CONTENT) { ...tagFragment } viewersCount } fragment searchForScheduleSegmentFragment on ScheduleSegment { id startAt endAt title hasReminder categories { id name } } fragment searchForUserFragment on User { broadcastSettings { id title } displayName followers { totalCount } id lastBroadcast { id startedAt } login profileImageURL(width: 150) description channel { id schedule { id nextSegment { ...searchForScheduleSegmentFragment } } } self { canFollow follower { disableNotifications } } latestVideo: videos(first: 1 sort: TIME type: ARCHIVE) { edges { node { ...searchForFeaturedVideoFragment } } } topClip: clips(first: 1 criteria: { sort: VIEWS_DESC }) { edges { node { ...searchForFeaturedClipFragment } } } roles { isPartner } stream { game { id name displayName } id previewImageURL(height: 120 width: 214) freeformTags { ...freeformTagFragment } type viewersCount } watchParty { session { id contentRestriction } } } fragment searchForFeaturedVideoFragment on Video { id lengthSeconds title previewThumbnailURL(width: 100 height: 56) } fragment searchForFeaturedClipFragment on Clip { id title durationSeconds thumbnailURL slug } fragment searchForVideoFragment on Video { createdAt owner { id displayName login roles { isPartner } } id game { id name displayName } lengthSeconds previewThumbnailURL(height: 120 width: 214) title viewCount }',
    }

    /** @type {import("./types.d.ts").AllSearchResponse} */
    const json = callGQL(gql)

    const sf = json.data.searchFor

    /** @type {PlatformVideo[]} */
    const results = []

    for (const e of sf.channels.edges) {
        if (e.item.stream !== null) {
            results.push(searchTaggedToPlatformVideo(e.item))
        }
    }

    for (const e of sf.channelsWithTag.edges) {
        results.push(searchTaggedToPlatformVideo(e.item))
    }

    // for (const e of sf.channels.edges) {
    //   results.push(searchTaggedToPlatformVideo(e.item))
    // }

    for (const e of sf.relatedLiveChannels.edges) {
        results.push(searchLiveToPlatformVideo(e.item))
    }

    for (const e of sf.videos.edges) {
        results.push(searchVideoToPlatformVideo(e.item))
    }

    return new SearchPagerAll(context, results)
}

/**
 * Gets a search pager for channels
 * @param {import("./types").SearchContext} context the query params
 * @returns {SearchPagerChannels} returns the search pager
 * @throws {ScriptException}
 */
function getSearchPagerChannels(context) {
    const gql = {
        extensions: {
            persistedQuery: {
                sha256Hash: '6ea6e6f66006485e41dbe3ebd69d5674c5b22896ce7b595d7fce6411a3790138',
                version: 1,
            },
        },
        operationName: 'SearchResultsPage_SearchResults',
        variables: {
            options: {
                targets: [
                    {
                        index: 'CHANNEL',
                        limit: context.page_size,
                        cursor: context?.cursor ?? null,
                    },
                ],
            },
            query: context.q,
            requestID: '',
        },
        query: '#import "twilight/features/tags/models/freeform-tag-fragment.gql" #import "twilight/features/tags/models/tag-fragment.gql" query SearchResultsPage_SearchResults( $query: String! $options: SearchForOptions $requestID: ID ) { searchFor( userQuery: $query platform: "web" options: $options requestID: $requestID ) { channels { ...searchForChannelsFragment } channelsWithTag { ...searchForChannelsWithTagFragment } games { ...searchForGamesFragment } videos { ...searchForVideosFragment } relatedLiveChannels { ...relatedLiveChannelsFragment } } } fragment relatedLiveChannelsFragment on SearchForResultRelatedLiveChannels { edges { trackingID item { ...searchRelatedLiveChannelFragment } } score } fragment searchForGamesFragment on SearchForResultGames { cursor edges { trackingID item { ...searchForGameFragment ...searchForVideoFragment ...searchForUserFragment } } score totalMatches } fragment searchForChannelsFragment on SearchForResultUsers { cursor edges { trackingID item { ...searchForUserFragment ...searchForVideoFragment ...searchForGameFragment } } score totalMatches } fragment searchForChannelsWithTagFragment on SearchForResultUsers { cursor edges { trackingID item { ...searchForUserFragment ...searchForVideoFragment ...searchForGameFragment } } score totalMatches } fragment searchForVideosFragment on SearchForResultVideos { cursor edges { trackingID item { ...searchForVideoFragment ...searchForUserFragment ...searchForGameFragment } } score totalMatches } fragment searchRelatedLiveChannelFragment on User { id stream { id viewersCount previewImageURL(height: 112 width: 200) game { name id } broadcaster { id primaryColorHex login displayName broadcastSettings { id title } roles { isPartner } } } watchParty { session { id contentRestriction } } } fragment searchForGameFragment on Game { id name displayName boxArtURL(height: 120 width: 90) tags(tagType: CONTENT) { ...tagFragment } viewersCount } fragment searchForScheduleSegmentFragment on ScheduleSegment { id startAt endAt title hasReminder categories { id name } } fragment searchForUserFragment on User { broadcastSettings { id title } displayName followers { totalCount } id lastBroadcast { id startedAt } login profileImageURL(width: 150) description channel { id schedule { id nextSegment { ...searchForScheduleSegmentFragment } } } self { canFollow follower { disableNotifications } } latestVideo: videos(first: 1 sort: TIME type: ARCHIVE) { edges { node { ...searchForFeaturedVideoFragment } } } topClip: clips(first: 1 criteria: { sort: VIEWS_DESC }) { edges { node { ...searchForFeaturedClipFragment } } } roles { isPartner } stream { game { id name displayName } id previewImageURL(height: 120 width: 214) freeformTags { ...freeformTagFragment } type viewersCount } watchParty { session { id contentRestriction } } } fragment searchForFeaturedVideoFragment on Video { id lengthSeconds title previewThumbnailURL(width: 100 height: 56) } fragment searchForFeaturedClipFragment on Clip { id title durationSeconds thumbnailURL slug } fragment searchForVideoFragment on Video { createdAt owner { id displayName login roles { isPartner } } id game { id name displayName } lengthSeconds previewThumbnailURL(height: 120 width: 214) title viewCount }',
    }

    /** @type {import("./types.d.ts").AllSearchResponse}*/
    const json = callGQL(gql)

    const results = json.data.searchFor.channels.edges.map((edge) => searchChannelToPlatformChannel(edge.item))

    context.cursor = json.data.searchFor.channels.cursor

    context.results_returned = results.length + context.results_returned

    return new SearchPagerChannels(results, json.data.searchFor.channels.totalMatches > context.results_returned, context)
}

//Pagers
class HomePagerPopular extends VideoPager {
    /**
     * @param {PlatformVideo[]} results the initial results
     * @param {boolean} hasNextPage if there is a next page
     * @param {import("./types.d.ts").HomeContext} context the context
     */
    constructor(results, hasNextPage, context) {
        super(results, hasNextPage, context)
    }

    nextPage() {
        return getHomePagerPopular(this.context)
    }
}

class HomePagerPersonalSections extends VideoPager {
    /**
     * @param {import("./types.d.ts").PagerBaseContext} context the context
     * @param {PlatformVideo[]} results the initial results
     */
    constructor(context, results) {
        super(results, results.length >= context.page_size, context)
    }

    nextPage() {
        this.context.page = this.context.page + 1
        return getHomePagerPersonalSections(this.context)
    }
}

class ChannelVideoPager extends VideoPager {
    /**
     * @param {import("./types.d.ts").URLContext} context the context
     * @param {PlatformVideo[]} results the initial results
     * @param {boolean} hasNextPage if there is a next page
     */
    constructor(context, results, hasNextPage) {
        super(results, hasNextPage, context)
    }

    nextPage() {
        return getChannelPager(this.context)
    }
}

class SearchPagerAll extends VideoPager {
    /**
     * @param {import("./types.d.ts").SearchContext} context the query params
     * @param {(PlatformVideo | PlatformChannel)[]} results the initial results
     */
    constructor(context, results) {
        super(results, false, context)
    }

    nextPage() {
        return null
    }
}

class SearchPagerVideos extends VideoPager {
    /**
     * @param {import("./types").SearchContext} context the query params
     * @param {PlatformVideo[]} results the initial results
     */
    constructor(context, results) {
        super(results, results.length >= context.page_size, context)
    }

    nextPage() {
        this.context.page = this.context.page + 1
        return getSearchPagerTracks(this.context)
    }
}

class SearchPagerChannels extends ChannelPager {
    constructor(results, hasNextPage, context) {
        super(results, hasNextPage, context)
    }

    nextPage() {
        return getSearchPagerChannels(this.context)
    }
}

class ExtendableCommentPager extends CommentPager {
    constructor(context, results) {
        super(results, results.length >= context.page_size, context)
    }

    nextPage() {
        this.context.page = this.context.page + 1
        return getCommentPager(this.context)
    }
}

//* Converters

/**
 * Convert a Live Twitch to a PlatformVideo
 * @param { import("./types.d.ts").RelatedLiveSearchResponse } sl
 * @returns { PlatformVideo }
 */
function searchLiveToPlatformVideo(sl) {
    return new PlatformVideo({
        id: new PlatformID(PLATFORM, sl.id, config.id),
        name: sl.stream.broadcaster.broadcastSettings.title,
        thumbnails: new Thumbnails([new Thumbnail(sl.stream.previewImageURL, 0)]),
        author: new PlatformAuthorLink(
            new PlatformID(PLATFORM, sl.stream.broadcaster.id, config.id, PLATFORM_CLAIMTYPE),
            sl.stream.broadcaster.displayName,
            BASE_URL + sl.stream.broadcaster.login,
            sl.stream.broadcaster.profileImageURL || ''
        ),
        uploadDate: parseInt(new Date().getTime() / 1000),
        duration: 0,
        viewCount: sl.stream.viewersCount,
        url: BASE_URL + sl.stream.broadcaster.login,
        shareUrl: BASE_URL + sl.stream.broadcaster.login,
        isLive: true,
    })
}

/**
 * Convert a Video Twitch to a PlatformVideo
 * @param { import("./types.d.ts").VideoSearchResponse } sv
 * @returns { PlatformVideo }
 */
function searchVideoToPlatformVideo(sv) {
    return new PlatformVideo({
        id: new PlatformID(PLATFORM, sv.id, config.id),
        name: sv.title,
        thumbnails: new Thumbnails([new Thumbnail(sv.previewThumbnailURL, 0)]),
        author: new PlatformAuthorLink(new PlatformID(PLATFORM, sv.owner.id, config.id, PLATFORM_CLAIMTYPE), sv.owner.displayName, BASE_URL + sv.owner.login, ''),
        uploadDate: parseInt(new Date(sv.createdAt).getTime() / 1000),
        duration: parseInt(sv.lengthSeconds),
        viewCount: sv.viewCount,
        url: BASE_URL + sv.owner.login + '/video/' + sv.id,
        isLive: false,
    })
}

/**
 * Convert a Channel Twitch to a PlatformVideo
 * @param { import("./types.d.ts").ChannelSearchResponse } st
 * @returns { PlatformChannel }
 */
function searchTaggedToPlatformVideo(st) {
    return new PlatformVideo({
        id: new PlatformID(PLATFORM, st.stream.id, config.id),
        name: st.broadcastSettings.title,
        thumbnails: new Thumbnails([new Thumbnail(st.stream.previewImageURL, 0)]),
        author: new PlatformAuthorLink(new PlatformID(PLATFORM, st.id, config.id, PLATFORM_CLAIMTYPE), st.displayName, BASE_URL + st.login, st.profileImageURL || ''),
        uploadDate: parseInt(new Date().getTime() / 1000),
        duration: 0,
        viewCount: st.stream.viewersCount,
        url: BASE_URL + st.login,
        shareUrl: BASE_URL + st.login,
        isLive: true,
    })
}

/**
 * Convert a Channel Twitch to a PlatformChannel
 * @param { import("./types.d.ts").ChannelSearchResponse } sc
 * @returns { PlatformChannel }
 */
function searchChannelToPlatformChannel(sc) {
    return new PlatformChannel({
        id: new PlatformID(PLATFORM, sc.id, config.id, PLATFORM_CLAIMTYPE),
        name: sc.displayName,
        thumbnail: sc.profileImageURL,
        banner: '',
        subscribers: sc.followers.totalCount,
        description: sc.description,
        url: BASE_URL + sc.login,
        links: [],
    })
}

function extractChannelId(url) {
    const match = url.match(REGEX_URL_CHANNEL);

    if (match && match[1]) {
        return match[1];
    } else {
        console.log("Channel ID not found.");
    }
}

/**
 * Checks if a URL matches any Twitch clip URL formats
 * @param {string} url - The URL to check
 * @returns {boolean} - True if the URL matches any regex, false otherwise
 */
function isTwitchClipDetailsUrl(url) {
    if (!url) return false;

    for (const regex of REGEX_URL_CLIP_DETAILS_LIST) {
        if (regex.test(url)) {
            return true;
        }
    }

    return false;
}

function isVideoUrl(url) {
    return REGEX_URL_VIDEO_DETAILS.test(url);
}

function isChannelUrl(url) {
    // Match valid channel URLs while excluding specific paths
    return (
        REGEX_URL_CHANNEL.test(url) 
     || REGEX_URL_CHANNEL_CLIPS_FILTER.test(url) 
    )
    && !isTwitchClipDetailsUrl(url) 
    && !isVideoUrl(url);
}

/**
 * Extracts the clip ID from various Twitch clip URL formats
 * @param {string} url - The Twitch clip URL
 * @returns {string|null} - The clip ID if found, null otherwise
 */
function extractTwitchClipSlug(url) {
    if (!url) return null;

    for (const regex of REGEX_URL_CLIP_DETAILS_LIST) {
        const match = url.match(regex);
        if (match) {
            return match[2];
        }
    }

    return null;
}

function extractTwitchVideoId(url) {
    if (!url) return null;

    const match = url.match(REGEX_URL_VIDEO_DETAILS);
    if (match) {
        return match[2]; // The second capturing group contains the video ID
    }

    return null; // Return null if no match
}

console.log('LOADED')
