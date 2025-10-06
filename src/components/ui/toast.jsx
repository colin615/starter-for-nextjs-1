"use client";

import toast from "react-hot-toast";
import { FaCircleCheck, FaCircleExclamation } from "react-icons/fa6";
import { IoIosWarning } from "react-icons/io";

import {
  TextureCardContent,
  TextureCardStyled,
} from "@/components/ui/texture-card";

export function showToast({ title, description, variant = "plain", button }) {
  toast((t) => (
    <TextureCardStyled>
      <TextureCardContent className="w-[400px] text-left text-white">
        <div className="justify-left mb-2 flex items-center gap-2 font-[500]">
          {variant === "success" && (
            <FaCircleCheck className="text-green-400" />
          )}
           {variant === "error" && (
            <FaCircleExclamation className="text-red-400" />
          )}
           {variant === "warning" && (
            <IoIosWarning className="text-yellow-500" />
          )}
          {title}
        </div>
        <div className="justify-left mb-4 flex gap-2 font-[300]">
          {description}
        </div>
        {button}
      </TextureCardContent>
    </TextureCardStyled>
  ));
}
