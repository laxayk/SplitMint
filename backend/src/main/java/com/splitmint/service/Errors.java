package com.splitmint.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

public final class Errors {
    private Errors() {}

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public static class BadRequest extends RuntimeException {
        public BadRequest(String msg) { super(msg); }
    }

    @ResponseStatus(HttpStatus.FORBIDDEN)
    public static class Forbidden extends RuntimeException {
        public Forbidden(String msg) { super(msg); }
    }

    @ResponseStatus(HttpStatus.NOT_FOUND)
    public static class NotFound extends RuntimeException {
        public NotFound(String msg) { super(msg); }
    }

    @ResponseStatus(HttpStatus.CONFLICT)
    public static class Conflict extends RuntimeException {
        public Conflict(String msg) { super(msg); }
    }
}
