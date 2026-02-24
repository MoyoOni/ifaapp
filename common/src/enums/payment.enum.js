"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProvider = exports.PaymentPurpose = void 0;
var PaymentPurpose;
(function (PaymentPurpose) {
    PaymentPurpose["WALLET_TOPUP"] = "WALLET_TOPUP";
    PaymentPurpose["BOOKING"] = "BOOKING";
    PaymentPurpose["MARKETPLACE_ORDER"] = "MARKETPLACE_ORDER";
    PaymentPurpose["COURSE_ENROLLMENT"] = "COURSE_ENROLLMENT";
    PaymentPurpose["GUIDANCE_PLAN"] = "GUIDANCE_PLAN";
})(PaymentPurpose || (exports.PaymentPurpose = PaymentPurpose = {}));
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["PAYSTACK"] = "PAYSTACK";
    PaymentProvider["FLUTTERWAVE"] = "FLUTTERWAVE";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
//# sourceMappingURL=payment.enum.js.map