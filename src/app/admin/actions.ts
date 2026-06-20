"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

const COOKIE = "kiyim_admin";

/** True if the request carries a valid admin cookie. */
export async function isAdmin() {
  const token = cookies().get(COOKIE)?.value;
  return Boolean(token && token === process.env.ADMIN_PASSWORD);
}

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password && password === process.env.ADMIN_PASSWORD) {
    cookies().set(COOKIE, password, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }
  revalidatePath("/admin");
}

export async function adminLogout() {
  cookies().delete(COOKIE);
  revalidatePath("/admin");
}

async function guard() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

export async function setStoreStatus(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const supabase = createAdminClient();
  await supabase.from("stores").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

export async function removeProduct(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const supabase = createAdminClient();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function addBanner(formData: FormData) {
  await guard();
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) return;

  const supabase = createAdminClient();
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const url = supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
  await supabase.from("banners").insert({
    image_url: url,
    link_url: String(formData.get("link") ?? "") || null,
    title: String(formData.get("title") ?? "") || null,
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteBanner(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const supabase = createAdminClient();
  await supabase.from("banners").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/");
}
