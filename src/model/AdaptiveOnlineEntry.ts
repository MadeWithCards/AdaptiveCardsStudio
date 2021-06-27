
export class AdaptiveOnlineEntryInstance {
    updatedAt?:      Date;
    state?:          string;
    isShareable?:    boolean;
    json?:           JSON;
    version?:        string;
    author?:         string;
}

export class AdaptiveOnlineEntry {
    id:              string;
    authors?:         string[];
    tags?:            string[];
    deletedVersions?: any[];
    isLive?:          boolean;
    name?:            string;
    instances?:       AdaptiveOnlineEntryInstance[];
    updatedAt?:       Date;
    createdAt?:       Date;
}

export class CardListResponse {
    cards:      Card[];
    totalCards: number;
}

export class Card {
    code:                   string;
    name:                   string;
    description:            string;
    template:               string;
    data:                   string;
    cardVersion:            number;
    forVersion:             string;
    previewImage:           null;
    tags:                   null;
    category:               null;
    isPowerPlatformEnabled: boolean;
    isPublic:               boolean;
    id:                     string;
}

