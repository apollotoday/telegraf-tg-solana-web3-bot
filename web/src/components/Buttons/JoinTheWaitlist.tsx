import axios from "axios";
import validator from "validator";

import { useState } from "react";

import { Box, Input } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";

import { WhiteButton } from "@/components/Buttons";
import { ChevronRightIcon } from "@/components/Icons";

type userInformationType = {
  email: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  timeZone: string;
  languages: string;
};

const JoinTheWaitlist = ({ ...props }) => {
  const [email, setEmail] = useState("");

  const fetchUserInfo = async () => {
    try {
      if (!email) return;
      if (!validator.isEmail(email)) {
        toaster.create({
          type: "error",
          title: "Error",
          description: "Please enter a valid email",
        });
        return;
      }
      const response = await axios.get("https://ipapi.co/json/");
      const locationData = await response.data;

      const language = navigator.language || "Unknown";
      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";

      const data: userInformationType = {
        email,
        ip: locationData.ip || "Unknown",
        city: locationData.city || "Unknown",
        region: locationData.region || "Unknown",
        country: locationData.country || "Unknown",
        languages: language,
        timeZone: timeZone,
      };
      console.log("User information", data);
      toaster.create({
        title: "Success",
        description: "Your Email successfully saved",
      });
      const endpoint = "/api/save-user";

      const saveInfoResponse = await axios.post(endpoint, data);
      if (saveInfoResponse.status === 200) {
        toaster.create({
          title: "Success",
          description: "Your Email successfully saved",
        });
        return;
      }
    } catch (error) {
      console.error("Error fetching user information", error);
    }
  };

  return (
    <Box pos={"relative"} w={{ base: "full", md: "487px" }} {...props}>
      <Input
        w={"full"}
        h={"65px"}
        variant={"outline"}
        px={"24px"}
        borderRadius={"100px"}
        borderColor={"#898989"}
        borderWidth={1}
        placeholder="Your email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <WhiteButton
        onClick={fetchUserInfo}
        TextComponent={() => (
          <Box fontSize={"16px"} lineHeight={"24px"} fontWeight={"500"}>
            Join the waitlist
          </Box>
        )}
        RightIcon={ChevronRightIcon}
        pos={"absolute"}
        right={"10px"}
        top={"10px"}
        h={"45px"}
      />
    </Box>
  );
};

export default JoinTheWaitlist;
