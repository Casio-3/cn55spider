vcl 4.1;

backend default {
    .host = "app:8082";
}

sub vcl_recv {
    // avoid case bypass
    if (req.url ~ "(?i)/admin" && !(req.http.Authorization ~ "^Basic TOKEN$")) {
        return (synth(403, "Access Denied"));
    }
}

sub vcl_synth {
    if (resp.status == 403) {
        set resp.body = resp.reason;
        return (deliver);
    }
}
