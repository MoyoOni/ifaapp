"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoDeleteDays = exports.PrivacyLevel = void 0;
var PrivacyLevel;
(function (PrivacyLevel) {
    PrivacyLevel["PUBLIC"] = "PUBLIC";
    PrivacyLevel["COMMUNITY"] = "COMMUNITY";
    PrivacyLevel["PRIVATE"] = "PRIVATE";
    PrivacyLevel["CONFIDENTIAL"] = "CONFIDENTIAL";
})(PrivacyLevel || (exports.PrivacyLevel = PrivacyLevel = {}));
var AutoDeleteDays;
(function (AutoDeleteDays) {
    AutoDeleteDays[AutoDeleteDays["NEVER"] = 0] = "NEVER";
    AutoDeleteDays[AutoDeleteDays["SEVEN_DAYS"] = 7] = "SEVEN_DAYS";
    AutoDeleteDays[AutoDeleteDays["THIRTY_DAYS"] = 30] = "THIRTY_DAYS";
    AutoDeleteDays[AutoDeleteDays["NINETY_DAYS"] = 90] = "NINETY_DAYS";
})(AutoDeleteDays || (exports.AutoDeleteDays = AutoDeleteDays = {}));
//# sourceMappingURL=messaging.enum.js.map