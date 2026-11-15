package dev.selflearn.hello;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class AppTest {

    @Test
    void ordinaryOrderSucceeds() {
        assertEquals(200, App.orderStatus(1));
        assertEquals(200, App.orderStatus(13));
    }

    @Test
    void multipleOfSevenFails() {
        assertEquals(500, App.orderStatus(7));
        assertEquals(500, App.orderStatus(70));
    }
}
