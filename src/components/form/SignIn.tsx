"use client";
import React, { FC, useState } from "react";
import { Mail, RectangleEllipsis, User } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

type FormInputPost = {
  email: string;
  username: string;
  password: string;
};

const SignIn = () => {
  const router = useRouter();
  const [error, setError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputPost>();

  const onSubmit: SubmitHandler<FormInputPost> = async (data) => {
    // Pass in form data to Sign in
    const signInData = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    console.log("Ret: ", signInData);
    if (signInData?.error) {
      console.log("error: ", signInData.error);
      setError(true);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 p-5 w-fit border m-auto mt-32 bg-slate-200"
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
          <span className="text-red-600 prose">{errors.email?.message}</span>
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
        <button type="submit" className={`btn w-full  btn-neutral`}>
          Sign In
        </button>
        <button
          type="button"
          onClick={async () =>
            await signIn("google", { callbackUrl: "/profile" })
          }
          className={`btn w-full btn-neutral`}
        >
          Sign In with Google
        </button>
      </div>
      <div className="flex flex-col items-center gap-5">
        <div className="w-9/12 h-[2px] bg-slate-500 m-auto"></div>{" "}
        <Link
          href="/sign-up"
          className="hover:scale-110 transition-transform duration-200 underline text-blue-800"
        >
          Don&apos;t have an account?
        </Link>
        {error ? (
          <div className="text-red-600">Error Incorrect Credentials</div>
        ) : (
          ""
        )}
      </div>
    </form>
  );
};

export default SignIn;
