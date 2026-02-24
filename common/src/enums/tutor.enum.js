"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorSessionStatus = exports.TutorStatus = void 0;
var TutorStatus;
(function (TutorStatus) {
    TutorStatus["PENDING"] = "PENDING";
    TutorStatus["APPROVED"] = "APPROVED";
    TutorStatus["SUSPENDED"] = "SUSPENDED";
    TutorStatus["REJECTED"] = "REJECTED";
})(TutorStatus || (exports.TutorStatus = TutorStatus = {}));
var TutorSessionStatus;
(function (TutorSessionStatus) {
    TutorSessionStatus["UPCOMING"] = "UPCOMING";
    TutorSessionStatus["IN_SESSION"] = "IN_SESSION";
    TutorSessionStatus["COMPLETED"] = "COMPLETED";
    TutorSessionStatus["CANCELLED"] = "CANCELLED";
})(TutorSessionStatus || (exports.TutorSessionStatus = TutorSessionStatus = {}));
//# sourceMappingURL=tutor.enum.js.map