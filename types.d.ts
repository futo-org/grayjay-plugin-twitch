type StreamUser = {
    __typename: 'User'
    displayName: string
    id: string
    login: string
    profileImageURL: string
    primaryColorHex: string
}

type Game = {
    __typename: 'Game'
    boxArtURL: string
    displayName: string
    id: string
    name: string
}

type FreeformTag = {
    __typename: 'FreeformTag'
    id: string
    name: string
}

type StreamNode = {
    __typename: 'Stream'
    broadcaster: StreamUser
    freeformTags: FreeformTag[]
    game: Game
    id: string
    previewImageURL: string
    title: string
    type: string
    viewersCount: number
}

type StreamEdge = {
    __typename: 'StreamEdge'
    cursor: string
    trackingID: string
    node: StreamNode
}

type SearchSuggestionChannel = {
    __typename: 'SearchSuggestionChannel'
    id: string
    isLive: boolean
    isVerified: boolean
    login: string
    profileImageURL: string
    user: {
        id: string
        stream: {
            id: string
            game: {
                id: string
                __typename: 'Game'
            }
            __typename: 'Stream'
        }
        __typename: 'User'
    }
}

type SearchSuggestionNode = {
    __typename: 'SearchSuggestion'
    content: SearchSuggestionChannel
    matchingCharacters: {
        __typename: 'SearchSuggestionHighlight'
        start: number
        end: number
    }
    id: string
    text: string
}

type SearchSuggestionEdge = {
    __typename: 'SearchSuggestionEdge'
    node: SearchSuggestionNode
}

type DataWrapper<Data> = {
    data: Data
    extensions: {
        durationMilliseconds: number
        operationName: string
        requestID: string
    }
}

export type HomepageResponse = DataWrapper<{
    streams: {
        edges: StreamEdge[]
        pageInfo: {
            __typename: 'PageInfo'
            hasNextPage: boolean
        }
    }
}>

export type SearchSuggestionsResponse = DataWrapper<{
    searchSuggestions: {
        __typename: 'SearchSuggestionsConnection'
        tracking: {
            __typename: 'SearchSuggestionTracking'
            modelTrackingID: string
            responseID: string
        }
        edges: SearchSuggestionEdge[]
    }
}>

type ChannelSearchResponse = {
    broadcastSettings: {
        __typename: 'BroadcastSettings'
        id: string
        title: string
    }
    displayName: string
    followers: {
        totalCount: number
        __typename: 'FollowerConnection'
    }
    id: string
    lastBroadcast: {
        __typename: 'Broadcast'
        id: string
        startedAt: string
    }
    login: string
    profileImageURL: string
    description: string
    channel: {
        __typename: 'Channel'
        id: string
        schedule: {
            __typename: 'Schedule'
            nextSegment: {
                __typename: 'ScheduleSegment'
                id: string
                startTime: string
                title: string
            }
            id: string
        }
    }
    self: any
    latestVideo: {
        __typename: 'VideoConnection'
        edges: {
            __typename: 'VideoEdge'
            node: {
                __typename: 'Video'
                id: string
                title: string
                lengthSeconds: number
                previewThumbnailURL: string
            }
        }[]
    }
    topClip: {
        __typename: 'ClipConnection'
        edges: {
            __typename: 'ClipEdge'
            node: {
                __typename: 'Clip'
                id: string
                title: string
                durationSeconds: number
                thumbnailURL: string
                slug: string
            }
        }[]
    }
    roles: {
        isPartner: boolean
        __typename: 'UserRoles'
    }
    stream: {
        __typename: 'Stream'
        id: string
        viewersCount: number
        previewImageURL: string
        game: {
            __typename: 'Game'
            id: string
            name: string
            displayName: string
        }
        freeformTags: {
            __typename: 'FreeformTag'
            id: string
            name: string
        }[]
    }
    watchParty: any
    __typename: 'User'
}

type GameSearchResponse = {
    __typename: 'Game'
    id: string
    displayName: string
    name: string
    boxArtURL: string
    tags: {
        __typename: 'Tag'
        id: string
        tagName: string
        localizedName: string
        isLanguageTag: boolean
    }[]
    viewersCount: number
}

type VideoSearchResponse = {
    __typename: 'Video'
    id: string
    title: string
    lengthSeconds: number
    previewThumbnailURL: string
    createdAt: string
    viewCount: number
    owner: {
        __typename: 'User'
        displayName: string
        id: string
        login: string
        roles: {
            __typename: 'UserRoles'
            isPartner: boolean
        }
    }
    game: {
        __typename: 'Game'
        id: string
        displayName: string
        name: string
    }
}

type RelatedLiveSearchResponse = {
    __typename: 'User'
    id: string
    watchParty: any
    stream: {
        __typename: 'Stream'
        id: string
        viewersCount: number
        previewImageURL: string
        game: {
            __typename: 'Game'
            id: string
            name: string
        }
        broadcaster: {
            __typename: 'User'
            id: string
            primaryColorHex: string
            login: string
            displayName: string
            broadcastSettings: {
                id: string
                title: string
                __typename: 'BroadcastSettings'
            }
            roles: {
                __typename: 'UserRoles'
                isPartner: boolean
            }
        }
    }
}

type SearchEdgeWrapper<ItemType> = {
    __typename: string
    score: number
    totalMatches: number
    cursor: string
    edges: { trackingID: string; item: ItemType; __typename: 'SearchForEdge' }[]
}

export type AllSearchResponse = DataWrapper<{
    searchFor: {
        __typename: 'SearchFor'
        channels: SearchEdgeWrapper<ChannelSearchResponse>
        channelsWithTag: SearchEdgeWrapper<ChannelSearchResponse>
        games: SearchEdgeWrapper<GameSearchResponse>
        videos: SearchEdgeWrapper<VideoSearchResponse>
        relatedLiveChannels: SearchEdgeWrapper<RelatedLiveSearchResponse>
    }
}>

type TeamBase = {
    __typename: 'Team'
    id: string
    displayName: string
    name: string
}

export type StreamMetadataResponse = DataWrapper<{
    user: {
        __typename: 'User'
        id: string
        primaryColorHex?: string
        isPartner: boolean
        profileImageURL: string
        primaryTeam: TeamBase
        squadStream: Object
        channel: {
            __typename: 'Channel'
            id: string
            chanlets?: any[]
        }
        lastBroadcast: {
            __typename: 'Broadcast'
            id: string
            title: string
        }
        stream: {
            __typename: 'Stream'
            id: string
            type: string
            game: {
                __typename: 'Game'
                id: string
                name: string
            }
        }
    }
}>

export type UseLiveResponse = DataWrapper<{
    user: {
        __typename: 'User'
        id: string
        login: string
        stream: {
            __typename: 'Stream'
            id: string
            createdAt: string
        }
    }
}>

export type ChannelAboutResponse = DataWrapper<{
    currentUser?: any
    user: {
        __typename: 'User'
        id: string
        displayName: string
        description: string
        isPartner: boolean
        primaryColorHex: string
        profileImageURL: string
        followers: {
            __typename: 'FollowerConnection'
            totalCount: number
        }
        channel: {
            __typename: 'Channel'
            id: string
            schedule: {
                __typename: 'Schedule'
                id: string
                nextSegment: {
                    __typename: 'ScheduleSegment'
                    id: string
                    startAt: string
                    hasReminder: boolean
                }
            }
            socialMedias: {
                id: string
                name: string
                title: string
                url: string
                __typename: 'SocialMedia'
            }[]
        }
        lastBroadcast: {
            __typename: 'Broadcast'
            id: string
            game: {
                __typename: 'Game'
                id: string
                displayName: string
            }
        }
        primaryTeam: TeamBase
        videos: {
            __typename: 'VideoConnection'
            edges: {
                __typename: 'VideoEdge'
                node: {
                    __typename: 'Video'
                    id: string
                    status: string
                    game: {
                        __typename: 'Game'
                        id: string
                        displayName: string
                    }
                }
            }[]
        }
    }
}>

export type ViewCountResponse = DataWrapper<{
    user: {
        __typename: 'User'
        id: string
        stream: {
            __typename: 'Stream'
            id: string
            viewersCount: number
        }
    }
}>

export type ChannelShellResponse = DataWrapper<{
    userOrError: {
        __typename: 'User'
        id: string
        displayName: string
        login: string
        primaryColorHex: string
        profileImageURL: string
        bannerImageURL: string
        stream: {
            __typename: 'Stream'
            id: string
            viewersCount: number
        }
        channel: {
            __typename: 'Channel'
            id: string
            self: {
                __typename: 'ChannelSelfEdge'
                isAuthorized: boolean
                restrictionType?: string
            }
            trailer: {
                __typename: 'Trailer'
                video?: {
                    __typename: 'Video'
                    id: string
                    title: string
                    lengthSeconds: number
                    previewThumbnailURL: string
                }
            }
            home: {
                __typename: 'ChannelHome'
                preferences: {
                    __typename: 'ChannelHomePreferences'
                    heroPreset: string
                }
            }
        }
    }
}>

export type PersonalSection = {
    __typename: 'PersonalSectionChannel'
    trackingID: string
    promotionsCampaignID: string
    user: {
        __typename: 'User'
        id: string
        displayName: string
        login: string
        profileImageURL: string
        primaryColorHex: string
        broadcastSettings: {
            __typename: 'BroadcastSettings'
            title: string
            id: string
        }
    }
    label: string
    content: {
        __typename: 'Stream'
        id: string
        viewersCount: number
        previewImageURL: string
        game: {
            __typename: 'Game'
            id: string
            displayName: string
            name: string
        }
        broadcaster: {
            __typename: 'User'
            id: string
            broadcastSettings: {
                __typename: 'BroadcastSettings'
                title: string
                id: string
            }
        }
    }
}

export type PersonalSectionsResponse = DataWrapper<{
    personalSections: {
        type: 'RECOMMENDED_SECTION'
        title: {
            __typename: 'PersonalSectionTitle'
            localizedFallback: string
            localizedTokens: {
                __typename: 'PersonalSectionTextToken'
                value: string
            }[]
        }
        items: PersonalSection[]
    }[]
}>

export type PersonalSectionsFollowedResponse = DataWrapper<{
    personalSections: {
        type: 'RECS_FOLLOWED_SECTION'
        title: {
            __typename: 'PersonalSectionTitle'
            localizedFallback: string
            localizedTokens: {
                __typename: 'PersonalSectionTextToken'
                value: string
            }[]
        }
        items: {
            __typename: 'PersonalSectionChannel'
            trackingID: string
            promotionsCampaignID: string
            user: {
                __typename: 'User'
                id: string
                displayName: string
                login: string
                profileImageURL: string
                primaryColorHex: string
                broadcastSettings: {
                    __typename: 'BroadcastSettings'
                    title: string
                    id: string
                }
            }
            label: string
            content: {
                __typename: 'VideoConnection' | 'Stream'
                id: string
                previewImageURL: string
                broadcaster: {
                    __typename: 'User'
                    id: string
                    broadcastSettings: {
                        __typename: 'BroadcastSettings'
                        title: string
                        id: string
                    }
                }
                viewersCount: number
                game: {
                    __typename: 'Game'
                    id: string
                    displayName: string
                    name: string
                }
                type: 'live'
            }
        }[]
    }[]
}>

export type PlaybackAccessTokenResponse = DataWrapper<{
    streamPlaybackAccessToken?: {
        __typename: 'StreamPlaybackAccessToken'
        value: string
        signature: string
    }
    videoPlaybackAccessToken?: {
        __typename: 'PlaybackAccessToken'
        value: string
        signature: string
    }
}>

export type ChannelVideoCoreResponse = DataWrapper<{
    video: {
        __typename: 'Video'
        id: string
        owner: {
            __typename: 'User'
            id: string
            login: string
            displayName: string
            primaryColorHex: string
            profileImageURL: string
            stream?: Object
            channel: {
                __typename: 'Channel'
                id: string
                self: {
                    __typename: 'ChannelSelfEdge'
                    isAuthorized: boolean
                    restrictionType?: string
                }
                trailer: {
                    __typename: 'Trailer'
                    video?: {
                        __typename: 'Video'
                        id: string
                        title: string
                        lengthSeconds: number
                        previewThumbnailURL: string
                    }
                }
            }
        }
    }
}>

export type VideoMetadataResponse = DataWrapper<{
    user: {
        __typename: 'User'
        id: string
        primaryColorHex: string
        isPartner: boolean
        profileImageURL: string
        lastBroadcast: {
            __typename: 'Broadcast'
            id: string
            startedAt: string
        }
    }
    video: {
        __typename: 'Video'
        id: string
        title: string
        description?: string
        previewThumbnailURL: string
        createdAt: string
        viewCount: number
        publishedAt: string
        lengthSeconds: number
        broadcastType: string
        owner: {
            __typename: 'User'
            id: string
            login: string
            displayName: string
        }
        game: {
            __typename: 'Game'
            id: string
            displayName: string
            name: string
            boxArtURL: string
        }
    }
}>

export type VideoTowerResponse = DataWrapper<{
    user: {
        __typename: 'User'
        id: string
        videos: {
            __typename: 'VideoConnection'
            pageInfo: {
                __typename: 'PageInfo'
                hasNextPage: boolean
            }
            edges: {
                __typename: 'VideoEdge'
                cursor: string
                node: {
                    __typename: 'Video'
                    id: string
                    animatedPreviewURL: string
                    game: {
                        __typename: 'Game'
                        id: string
                        displayName: string
                        name: string
                        boxArtURL: string
                    }
                    lengthSeconds: number
                    owner: {
                        __typename: 'User'
                        id: string
                        login: string
                        displayName: string
                        profileImageURL: string
                        primaryColorHex: string
                    }
                    previewThumbnailURL: string
                    publishedAt: string
                    self: {
                        __typename: 'VideoSelfEdge'
                        isRestricted: boolean
                        viewingHistory: {
                            __typename: 'VideoViewingHistory'
                            viewedAt: string
                        }
                    }
                    title: string
                    viewCount: number
                    contentTags: {
                        __typename: 'Tag'
                        id: string
                        tagName: string
                        localizedName: string
                        isLanguageTag: boolean
                    }[]
                }
            }[]
        }
    }
}>

export type BrowsePopularResponse = DataWrapper<{
    streams: {
        __typename: 'StreamConnection'
        pageInfo: {
            __typename: 'PageInfo'
            hasNextPage: boolean
        }
        edges: {
            __typename: 'StreamEdge'
            cursor: string
            trackingID: string
            node: {
                __typename: 'Stream'
                id: string
                title: string
                viewersCount: number
                previewImageURL: string
                broadcaster: {
                    __typename: 'User'
                    id: string
                    displayName: string
                    login: string
                    profileImageURL: string
                    primaryColorHex: string
                }
                freeformTags: {
                    __typename: 'FreeformTag'
                    id: string
                    name: string
                }[]
                game: {
                    __typename: 'Game'
                    id: string
                    displayName: string
                    name: string
                    boxArtURL: string
                }
                type: 'live'
            }
        }[]
    }
}>

export type PagerBaseContext = {
    page: number
    page_size: number
}

export type SearchContext = {
    q: string
    page_size: number
    cursor?: string
    results_returned: number
}

export type HomeContext = {
    cursor?: string
    page_size: number
}

export type URLContext = {
    url: string
    page_size: number
    cursor?: string
}

export type LiveEventsContext = {
    // object of emoji id to emoji name
    emojis: { [key: string]: string }
    events: LiveEvent[]
    channel_id: string
    login: string
}

export type RecentChat = {
    id: string
    deletedAt?: string
    sentAt: string
    content: {
        text: string
        fragments: {
            text: string
            content?:
                | {
                      emoteID: string
                      setID: string
                      token: string
                      __typename: 'Emote'
                  }
                | {
                      id: string
                      login: string
                      displayName: string
                      __typename: 'User'
                  }
            __typename: 'MessageFragment'
        }[]
        __typename: 'MessageContent'
    }
    parentMessage?: string
    sender: {
        id: string
        login: string
        chatColor: string
        displayName: string
        __typename: 'User'
    }
    senderBadges: {
        setID: string
        version: string
        id: string
        __typename: 'Badge'
    }[]
}

export type RecentChatsResponse = DataWrapper<{
    channel: {
        __typename: 'Channel'
        id: string
        recentChatMessages: RecentChat[]
    }
}>

type Badge = {
    id: string
    setID: string
    version: string
    title: string
    image1x: string
    image2x: string
    image4x: string
    clickAction: string
    clickURL: string
    __typename: 'Badge'
}

type BadgeUser = {
    id: string
    primaryColorHex: string
    broadcastBadges: Badge[]
    self: {
        selectedBadge?: Badge
        displayBadges: Badge[]
        __typename: 'UserSelfConnection'
    }
    squadStream: any
    __typename: 'User'
}

export type BadgeListResponse = DataWrapper<{
    user: BadgeUser
    badges: Badge[]
}>
