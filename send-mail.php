<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $to = "bunnisz13@gmail.com";
    $subject = "New Inquiry from Tension Masters";

    $strings = htmlspecialchars($_POST["strings"]);
    $rackets = htmlspecialchars($_POST["rackets"]);
    $delivery = htmlspecialchars($_POST["delivery"]);

    $message = "New Inquiry Details:\n\n";
    $message .= "Type of Strings: $strings\n";
    $message .= "Number of Rackets: $rackets\n";
    $message .= "Delivery Option: $delivery\n";

    $headers = "From: noreply@yourdomain.com\r\n";
    $headers .= "Reply-To: $to\r\n";

    if (mail($to, $subject, $message, $headers)) {
        echo "<h2>Thank you! Your inquiry has been sent.</h2>";
        echo "<p><a href='services.html'>← Back to Services</a></p>";
    } else {
        echo "<h2>Sorry, something went wrong. Please try again.</h2>";
        echo "<p><a href='services.html'>← Back to Services</a></p>";
    }
}
?>
