"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostStatus = exports.ThreadStatus = void 0;
var ThreadStatus;
(function (ThreadStatus) {
    ThreadStatus["ACTIVE"] = "ACTIVE";
    ThreadStatus["LOCKED"] = "LOCKED";
    ThreadStatus["PINNED"] = "PINNED";
    ThreadStatus["ARCHIVED"] = "ARCHIVED";
    ThreadStatus["DELETED"] = "DELETED";
})(ThreadStatus || (exports.ThreadStatus = ThreadStatus = {}));
var PostStatus;
(function (PostStatus) {
    PostStatus["ACTIVE"] = "ACTIVE";
    PostStatus["EDITED"] = "EDITED";
    PostStatus["DELETED"] = "DELETED";
    PostStatus["HIDDEN"] = "HIDDEN";
})(PostStatus || (exports.PostStatus = PostStatus = {}));
//# sourceMappingURL=forum.enum.js.map