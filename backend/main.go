package main

import (
    "log"
    "net/http"
    "github.com/gorilla/mux"
)

func main() {
    router := mux.NewRouter()

    // API routes
    RegisterAPIRoutes(router)

    // Serve frontend during dev:
    router.PathPrefix("/").Handler(http.FileServer(http.Dir("../dist")))

    log.Println("Dev backend running at http://localhost:9000")
    http.ListenAndServe(":9000", router)
}
