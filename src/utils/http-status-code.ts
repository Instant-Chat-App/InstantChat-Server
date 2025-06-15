import { Http } from "winston/lib/winston/transports";

export const HttpStatusCode = {
  // 1xx Informational
  CONTINUE: 100,                // Tiếp tục gửi request
  SWITCHING_PROTOCOLS: 101,     // Chuyển đổi giao thức
  PROCESSING: 102,              // Đang xử lý (WebDAV)
  EARLY_HINTS: 103,             // Gợi ý sớm

  // 2xx Success
  OK: 200,                      // Thành công
  CREATED: 201,                 // Tạo mới thành công
  ACCEPTED: 202,                // Đã nhận request, đang xử lý
  NON_AUTHORITATIVE_INFORMATION: 203, // Dữ liệu không chính thức
  NO_CONTENT: 204,              // Thành công, không trả dữ liệu
  RESET_CONTENT: 205,           // Yêu cầu reset form
  PARTIAL_CONTENT: 206,         // Trả về một phần dữ liệu
  MULTI_STATUS: 207,            // Trạng thái nhiều phần (WebDAV)
  ALREADY_REPORTED: 208,        // Đã báo cáo (WebDAV)
  IM_USED: 226,                 // IM Used

  // 3xx Redirection
  MULTIPLE_CHOICES: 300,        // Nhiều lựa chọn
  MOVED_PERMANENTLY: 301,       // Đã chuyển hướng vĩnh viễn
  FOUND: 302,                   // Đã tìm thấy (tạm thời)
  SEE_OTHER: 303,               // Xem vị trí khác
  NOT_MODIFIED: 304,            // Không thay đổi dữ liệu
  USE_PROXY: 305,               // Dùng proxy (deprecated)
  SWITCH_PROXY: 306,            // Switch Proxy (không dùng)
  TEMPORARY_REDIRECT: 307,      // Chuyển hướng tạm thời
  PERMANENT_REDIRECT: 308,      // Chuyển hướng vĩnh viễn

  // 4xx Client Error
  BAD_REQUEST: 400,             // Request sai cú pháp
  UNAUTHORIZED: 401,            // Chưa xác thực hoặc sai token
  PAYMENT_REQUIRED: 402,        // Cần thanh toán (ít dùng)
  FORBIDDEN: 403,               // Không có quyền truy cập
  NOT_FOUND: 404,               // Không tìm thấy
  METHOD_NOT_ALLOWED: 405,      // Phương thức không được phép
  NOT_ACCEPTABLE: 406,          // Không chấp nhận theo yêu cầu
  PROXY_AUTHENTICATION_REQUIRED: 407, // Yêu cầu xác thực proxy
  REQUEST_TIMEOUT: 408,         // Request timeout
  CONFLICT: 409,                // Xung đột dữ liệu
  GONE: 410,                    // Đã bị xóa
  LENGTH_REQUIRED: 411,         // Thiếu header Content-Length
  PRECONDITION_FAILED: 412,     // Điều kiện tiên quyết thất bại
  PAYLOAD_TOO_LARGE: 413,       // Dữ liệu gửi lên quá lớn
  URI_TOO_LONG: 414,            // URI quá dài
  UNSUPPORTED_MEDIA_TYPE: 415,  // Loại dữ liệu không hỗ trợ
  RANGE_NOT_SATISFIABLE: 416,   // Yêu cầu phạm vi không hợp lệ
  EXPECTATION_FAILED: 417,      // Kỳ vọng thất bại
  IM_A_TEAPOT: 418,             // Tôi là cái ấm trà (mã hài hước)
  MISDIRECTED_REQUEST: 421,     // Request sai máy chủ
  UNPROCESSABLE_ENTITY: 422,    // Không thể xử lý entity (WebDAV)
  LOCKED: 423,                  // Tài nguyên bị khóa (WebDAV)
  FAILED_DEPENDENCY: 424,       // Lỗi phụ thuộc (WebDAV)
  TOO_EARLY: 425,               // Quá sớm
  UPGRADE_REQUIRED: 426,        // Yêu cầu nâng cấp giao thức
  PRECONDITION_REQUIRED: 428,   // Cần điều kiện tiên quyết
  TOO_MANY_REQUESTS: 429,       // Gửi quá nhiều request
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431, // Header quá lớn
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,   // Không thể truy cập vì lý do pháp lý

  // 5xx Server Error
  INTERNAL_SERVER_ERROR: 500,   // Lỗi server chung
  NOT_IMPLEMENTED: 501,         // Chưa hỗ trợ chức năng này
  BAD_GATEWAY: 502,             // Gateway nhận được phản hồi không hợp lệ
  SERVICE_UNAVAILABLE: 503,     // Dịch vụ không sẵn sàng
  GATEWAY_TIMEOUT: 504,         // Gateway timeout
  HTTP_VERSION_NOT_SUPPORTED: 505, // Phiên bản HTTP không hỗ trợ
  VARIANT_ALSO_NEGOTIATES: 506, // Variant Also Negotiates
  INSUFFICIENT_STORAGE: 507,    // Không đủ bộ nhớ (WebDAV)
  LOOP_DETECTED: 508,           // Vòng lặp được phát hiện (WebDAV)
  NOT_EXTENDED: 510,            // Chưa mở rộng
  NETWORK_AUTHENTICATION_REQUIRED: 511 // Cần xác thực mạng
} as const;

export type HttpStatusCode = (typeof HttpStatusCode)[keyof typeof HttpStatusCode];
