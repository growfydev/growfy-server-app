import instaloader
import sys
import time
import random
from dotenv import load_dotenv
import os
import requests
from fake_useragent import UserAgent
import contextlib
import io
from colorama import init, Fore

init(autoreset=True)

load_dotenv()

INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD")

def get_free_proxies():
    try:
        response = requests.get("https://www.sslproxies.org/")
        proxies = response.text.split("<td>")[1::2]
        proxy_list = [f"{proxies[i]}:{proxies[i+1]}" for i in range(0, len(proxies), 2)]
        return proxy_list
    except Exception as e:
        print(f"Error fetching proxies: {e}")
        return []

def get_random_user_agent():
    ua = UserAgent()
    return ua.random

def print_intro():
    print(Fore.MAGENTA + "Usage: python main.py -u <username>".center(50))
    print(Fore.RED + 'Type "exit" to stop the script.'.center(50))
    print(Fore.YELLOW + "=" * 50 + "\n")

def print_section_header(title):
    print(Fore.YELLOW + "\n" + "=" * 50)
    print(Fore.CYAN + title.center(50))
    print(Fore.YELLOW + "=" * 50)

def print_info(label, value):
    print(f"{Fore.GREEN}{label}: {Fore.WHITE}{value}")

def scrape_instagram(username):
    L = instaloader.Instaloader()

    proxies = get_free_proxies()
    if proxies:
        proxy = random.choice(proxies)
        L.context._session.proxies = {
            "http": f"http://{proxy}",
            "https": f"https://{proxy}",
        }
        print(f"Using proxy: {proxy}")

    user_agent = get_random_user_agent()
    L.context._session.headers.update({"User-Agent": user_agent})
    print(f"Using User-Agent: {user_agent}")

    try:
        L.load_session_from_file(INSTAGRAM_USERNAME)
    except FileNotFoundError:
        L.context.log("Session file does not exist yet - Logging in.")
        try:
            L.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
            L.save_session_to_file()
        except instaloader.exceptions.TwoFactorAuthRequiredException:
            print(
                "Two-factor authentication is required. Please log in manually and save the session."
            )
            return
        except instaloader.exceptions.ConnectionException as e:
            print(f"Connection error: {e}")
            return

    try:
        with contextlib.redirect_stderr(io.StringIO()):
            profile = instaloader.Profile.from_username(L.context, username)
        time.sleep(random.uniform(2, 5))
    except instaloader.exceptions.ProfileNotExistsException:
        print(f"Error: Profile '{username}' does not exist.")
        return
    except instaloader.exceptions.ConnectionException as e:
        print(f"Connection error: {e}")
        print("Waiting for 60 seconds before retrying...")
        time.sleep(60)
        return

    def safe_getattr(obj, attr, default="-"):
        try:
            return getattr(obj, attr, default)
        except KeyError:
            return default

    print_section_header("User Information")
    print_info("Username", profile.username)
    print_info("Full Name", profile.full_name)
    print_info("Biography", profile.biography)
    print_info("External URL", profile.external_url)
    print_info("Followers", profile.followers)
    print_info("Following", profile.followees)
    print_info("Number of Posts", profile.mediacount)
    print_info("Is Private", profile.is_private)
    print_info("Is Verified", profile.is_verified)
    print_info("User ID", profile.userid)
    with contextlib.redirect_stderr(io.StringIO()):
        profile_pic_url = profile.profile_pic_url
    print_info("Profile Picture URL", profile_pic_url)
    print_info("Number of IGTV Videos", safe_getattr(profile, 'igtvcount'))
    print_info("Business Category", safe_getattr(profile, 'business_category_name'))
    print_info("Is Business Account", safe_getattr(profile, 'is_business_account'))
    print_info("Is Joined Recently", safe_getattr(profile, 'is_joined_recently'))
    print_info("Business Email", safe_getattr(profile, 'business_email'))
    print_info("Business Phone Number", safe_getattr(profile, 'business_phone_number'))
    print_info("Business Address", safe_getattr(profile, 'business_address_json'))
    print_info("Number of Highlights", safe_getattr(profile, 'highlight_reel_count'))
    print_info("Number of Saved Posts", safe_getattr(profile, 'saved_media_count'))

    if not profile.is_private:
        print_section_header("Recent Posts")
        posts = profile.get_posts()
        for index, post in enumerate(posts):
            if index >= 5:
                break
            print(f"\n{Fore.MAGENTA}Post {index + 1}:")
            print(f"{Fore.CYAN}  Caption: {Fore.WHITE}{post.caption[:50]}...")
            print(f"{Fore.CYAN}  Likes: {Fore.WHITE}{post.likes}")
            print(f"{Fore.CYAN}  Comments: {Fore.WHITE}{post.comments}")
        
            print(f"{Fore.CYAN}  Comments List:")
            for comment in post.get_comments():
                print(f"    - {Fore.GREEN}{comment.owner.username}: {Fore.WHITE}{comment.text}")
                
            try:
                with open(os.devnull, 'w') as fnull, contextlib.redirect_stderr(fnull):
                    location = post.location
                if location:
                    print(f"{Fore.CYAN}  Location: {Fore.WHITE}{location}")
            except instaloader.exceptions.ConnectionException:
                pass
            print(f"{Fore.CYAN}  Timestamp: {Fore.WHITE}{post.date_local}")
            time.sleep(random.uniform(1, 3))

        print_section_header("Stories")
        stories = L.get_stories(userids=[profile.userid])
        story_found = False
        for story in stories:
            for item in story.get_items():
                if item.is_video:
                    print(f"{Fore.CYAN}Video Story URL: {Fore.WHITE}{item.video_url}")
                else:
                    print(f"{Fore.CYAN}Photo Story URL: {Fore.WHITE}{item.url}")
                story_found = True
                time.sleep(random.uniform(1, 3))
        if not story_found:
            print(Fore.RED + "No stories found.")

    print(Fore.YELLOW + "\n" + "=" * 50)
    print(Fore.RED + "Finished.".center(50))
    print(Fore.YELLOW + "=" * 50 + "\n")

if __name__ == "__main__":
    print_intro()
    while True:
        user_input = input(Fore.GREEN + "Enter Instagram username or 'exit' to stop: " + Fore.WHITE)
        if user_input.lower() == 'exit':
            print(Fore.RED + "Exiting the script.")
            sys.exit(0)
        else:
            scrape_instagram(user_input)