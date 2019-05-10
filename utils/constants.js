export const STATUSES = {
  UNPUBLISHED: "unpublished",
  PUBLISHING: "publishing",
  PUBLISHED: "published",
  FAILED: "publication_failed",
  RETRY: "waiting_for_retry",
  BURNED: "burned"
};

export const TYPES = {
  PUBLISH: "http://mu.semte.ch/vocabularies/ext/signing/PublishedResource",
  SIGN: "http://mu.semte.ch/vocabularies/ext/signing/SignedResource",
  BURN: "http://mu.semte.ch/vocabularies/ext/signing/BurnedResource"
};

export const TYPE_MAPPING = {
  "http://mu.semte.ch/vocabularies/ext/signing/PublishedResource": "publish",
  "http://mu.semte.ch/vocabularies/ext/signing/SignedResource": "sign",
  "http://mu.semte.ch/vocabularies/ext/signing/BurnedResource": "sign?burn=true"
};
