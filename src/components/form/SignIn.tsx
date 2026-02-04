"use client";
import React, { FC, useState } from "react";
import { Mail, RectangleEllipsis, User } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";

import { useRouter } from "next/navigation";

import { signIn, signInSocial } from "@/lib/actions/auth-actions";
import { auth } from "@/lib/auth";
import Link from "next/link";

type FormInputPost = {
  email: string;
  username: string;
  password: string;
};

const SignIn = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputPost>();

  const onSubmit: SubmitHandler<FormInputPost> = async (data) => {
    try {
      const result = await signIn(data.email, data.password);
      if (!result.user) {
        setError("Invalid email or password");
      }
    } catch (error) {
      setError("An error occurred");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="m-auto mt-32 flex w-fit flex-col gap-5 border bg-slate-200 p-5"
    >
      <div>
        <label className="input input-bordered flex items-center gap-2">
          <Mail />
          <input
            type="email"
            className="grow"
            placeholder="Email"
            {...register("email", {
              required: true,
            })}
          />
        </label>{" "}
        {errors.email && (
          <span className="prose text-red-600">{errors.email?.message}</span>
        )}
      </div>
      <div>
        <label className="input input-bordered flex items-center gap-2">
          <RectangleEllipsis />
          <input
            type="password"
            className="grow"
            placeholder="Password"
            {...register("password", {
              required: true,

              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
          />
        </label>
        {errors.password && (
          <span className="text-red-600">{errors.password?.message}</span>
        )}
      </div>
      <div className="flex flex-col gap-5">
        <button type="submit" className={`btn btn-neutral w-full`}>
          Sign In
        </button>
        <button
          type="button"
          onClick={async () => await signInSocial("google")}
          className={`btn btn-neutral w-full`}
        >
          Sign In with Google
        </button>
        <button
          type="button"
          onClick={async () => await signInSocial("github")}
          className={`btn btn-neutral w-full`}
        >
          Sign In with Github
        </button>
      </div>
      <div className="flex flex-col items-center gap-5">
        <div className="m-auto h-[2px] w-9/12 bg-slate-500"></div>{" "}
        <Link
          href="/sign-up"
          className="text-blue-800 underline transition-transform duration-200 hover:scale-110"
        >
          Don&apos;t have an account?
        </Link>
        {error.length > 0 && <span className="text-red-600">{error}</span>}
      </div>
    </form>
  );
};

export default SignIn;
