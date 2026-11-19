"use client";
import React, { FC, useState } from "react";
import { Mail, RectangleEllipsis, User } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/actions/auth-actions";
import Link from "next/link";
import { AuthCard, AuthField } from "./AuthCard";
import { SocialButtons } from "./SocialButtons";

type FormInputPost = {
  email: string;
  username: string;
  password: string;
};

interface ErrorResponse {
  message: string;
}

const SignUp = () => {
  const router = useRouter();
  const [cerror, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputPost>();

  const submit: SubmitHandler<FormInputPost> = async (data) => {
    addUser(data);
  };

  const {
    mutate: addUser,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async (newUserData: FormInputPost) => {
      const result = await signUp(
        newUserData.email,
        newUserData.password,
        newUserData.username,
      );
      if (!result.user) {
        throw new Error("Signup failed");
      }
      return result;
    },
    onError: (error) => {
      console.error("Error adding User:", error);
    },
    onSuccess: () => {
      router.push("/sign-in");
      console.log("User added successfully");
    },
  });
  const errorMessage = isError
    ? (error as AxiosError<ErrorResponse>)?.response?.data?.message
    : null;
  return (
    <AuthCard
      title="Start your cookbook"
      subtitle="Free, and your journal is private to you."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="link link-hover font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <AuthField
          label="Email"
          icon={<Mail />}
          error={errors.email && "Enter your email"}
        >
          <input
            type="email"
            className="grow"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email", { required: true })}
          />
        </AuthField>
        <AuthField
          label="Username"
          icon={<User />}
          error={
            errors.username?.message || (errors.username && "Pick a username")
          }
        >
          <input
            type="text"
            className="grow"
            placeholder="3–20 letters, numbers, _ or -"
            autoComplete="username"
            {...register("username", {
              required: true,
              pattern: {
                value: /^[a-zA-Z0-9_-]{3,20}$/,
                message: "Use 3–20 letters, numbers, _ or -",
              },
            })}
          />
        </AuthField>
        <AuthField
          label="Password"
          icon={<RectangleEllipsis />}
          error={
            errors.password?.message || (errors.password && "Choose a password")
          }
        >
          <input
            type="password"
            className="grow"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            {...register("password", {
              required: true,
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
          />
        </AuthField>
        {isError && (
          <p className="text-error text-sm">
            {errorMessage || "Couldn't create the account. Try again."}
          </p>
        )}
        <button
          type="submit"
          className="btn btn-primary mt-1 w-full font-serif"
          disabled={isPending}
        >
          {isPending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <div className="divider my-0 text-xs opacity-60">or</div>
      <SocialButtons />
    </AuthCard>
  );
};

export default SignUp;
