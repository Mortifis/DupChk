/* $Id: dup_user_check.js,v 01b 2019/07/20 16:24:35 mortifis Exp $ */

/* Synchronet v3.15 script (to be executed with jsexec) */

/*************************************************************************
Performs a basic check of the user database and reports duplicate
entries: [name], [alias], [email]. Options to Edit User:

Logfile is var logFile = "/sbbs/data/logs/dupuser.log"; SBBS is sane so this works on Windows OS

Can be run even when the BBS is offline!
*************************************************************************/

/*
	ToDo: 	* Add (js.global.console) - running from bbs and print colorized strings or if from command line print without colorization
			  
		* Load the data directory from system configs, better yet read logFile from modopts.ini
		
		* Add [dupchkr] in modopts.ini for security level FLAGS
		 (currently only the Security Level is changed not any exemptions/restrictions) 
		
		* Change the ability to access any user account to only the ones in the dup_list[]
		  dup_list.find() does not work under current version of js used by SBBS
		  Currently selecting any valid user number allows for editing that user!
	
	NOTE:  If you use emailval.js, setting a dupuser to the security level that
	       requires a re-evaluation of the email address would be beneficial! 
	
			flags1_after_change (default: no change)
			flags2_after_change (default: no change)
			flags3_after_change (default: no change)
			flags4_after_change (default: no change)
			exemptions_after_change (default: no change)
			restrictions_after_change (default: no change)
			expiration_after_change (default: false)
			expiration_days_after_change (default: no change)
	
	Note: the flags, exemptions, and restrictions .ini values support 'A' through
	      'Z' with the optional '+' (add) and '-' (remove) modifiers.
		      e.g. "+A-B" to add the A flag and remove the B flag
		      e.g. "AB" to change the flag set to just "AB"
		  Numeric values are supported for assignment (not modification).
		      e.g. 0 = no flags, 1 = A, 2 = B, 4 = C, 8 = D, etc.
		      
	Revisions: 0.1a    : Initial script; was just for email address comparisons.
		   0.1b    : Added command line options and -h help section, and switch case for Search Type
		   0.1c    : Added Search Type Switching, logging, and other stuffies
		   0.1c.r1 : Added range check so looking up a record beyond the lastuser or user #0 is not allowed
		   0.1c.2  : Changed range check to allow assing a user to the user base with basic values similar to
		             makeuser.js 
	 	   0.1c.3  : Added dupchk.ini for modifiable values (will be replace with modopts.ini entry later)
		             Add command line option -c to create/edit
		   0.1.3.2 : Changed Number Scheme,   
		   		* check if script is run from jsexec or from bbs ;exec ?dup_user_check.js 
		   		  ie: if(js.global.console)
		   		  	console.clear
		   		  else { conio.clrscr();
		   		  	  conio.suspend();
					}
		   		  	
*/

load("sbbsdefs.js");

if(js.global.console) 
{
		print("\1gLoading and searching for duplicate \1yEmail Addresses\1g ")
		var lookFor = "Email";
		var search = "netmail";
}

const REVISION = "$Revision: 0.1.3 $".split(' ')[1];
var done = false;
var lookFor = "";
var search = "";
var search1 = "";
var search2 = "";
var quiet=false;
var dup_list = [];
var is_there = false;

if(js.global.console) var mod = "\1w(LOGGING)\1g"; else var mod = "(LOGGING)";

var logFile = "/sbbs/data/logs/dupuser-"; // mylog() adds trailing date.log

function mylog(msg)
{  
    if(!quiet)
	var today = new Date();
	var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
	var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	var dateTime = date+' '+time;
	var f = new File(logFile + date + ".log");
	f.open("a");
	f.writeln("dup_"+search+"_check: (" + dateTime + ") " + msg);
	f.close();
}

function opts() // only used when run from jsexec
{
	// prints command line options and exits;
	print("Synchronet Dup Checker " + REVISION + "\r\n");
	print("Usage: jsexec dup_user_check.js <options>");
	print("ie: jsexec dup_user_check.js -a -q -s syspass");
	print("\r\t -a : search for dup aliases");
	print("\r\t -n : search for dup Real Names");
	print("\r\t -e : search for dup email addresses");
	print("\r\t -q : quiet, do not log activity");
	print("\r\t -s : system password (must be present and match system password)");
	print("\r\t -c : enter configuration");											
	print("\r\t -h : print help");
	print("\r\nIf no option is provided, defaults to search for dup email addresses");	
	done = true;
}

function find(dup_list, user_num) 
{
	var is_there = false;
  	for(x=0; x <= dup_list.length; x++) 
	{
     		if(dup_list[x].num == user_num) is_there = true;    
  	}
   
   	return is_there;
}

if(!js.global.console) 
{
if(argv[0] == "-h" || argv.length < 1) opts();

	for(i=0;i<argc;i++) 
		{
			switch(argv[i]) 
			{
				case "-s":
				if(!system.check_syspass(argv[++i])) 
				{
					print("\r\nIncorrect System Password ... exiting!");
					done = true;
					mylog("Incorrect Password"); 
					exit;
				}
			
				case "-n":
				search = "name"; 
				lookFor = "Real Name";
				break;
			
				case "-a":
				search = "alias"; 
				lookFor = "Alias";
				break;
			
				case "-e":			
				search = "netmail"; 
				lookFor = "Email"; 
				break;			
			
        			case "-q":
           		 	quiet=true;
			 	mod = "(Quiet Mode)";
           		 	break;	
			    
				case "-c":
				print("-c Option not implemented");
				mswait(2000);
				break;
			}
		}
}

if(!js.global.console)
{
	print("\r\nSynchronet BBS " + system.full_version + "  " + system.platform + " " + system.architecture + "\r");
	print("System Name: " + system.name + "  SysOp: " + system.operator + "\r\n");
} 
else
{
print("\1cSynchronet BBS \1w" + system.full_version + "  \1y" + system.platform + " " + system.architecture + "\r\n\r\n");
print("\1gSystem Name: \1y" + system.name + "  \1gSysOp: \1y" + system.operator + "\1g\r\n\r\n");

}
if(lookFor == ""); lookFor = "Email"; // this fixed blank when run from bbs
if(search == ""); search = "netmail"; //

mylog("Program Started --------------------------------");
mylog("Synchronet Duplicate " + lookFor + " Checker " + REVISION + " " + mod);


while(!done) 
{
	if(js.global.console) 
	{
		console.clear();
	}
	else
	{
		conio.clrscr();
		conio.suspend();
	}

printf("Synchronet Duplicate " + lookFor + " Checker " + REVISION + " " + mod + "\r\n\r\n");

var u; // user object
var d; // user object
var e; // user object
var dups = 0;
var recs = 0;
var lastuser;
var sysops = 0;

const dup_user = {
  number: '',
  alias: '',
  num: '',
  email: '',
  dup_alias: '',
  dup_num: '',
  dup_email: ''  
}

dup_list = [];

lastuser=system.lastuser;

for(i=1; i<=lastuser; i++) // loop through users and grab the email address
{
    u = new User(i);
    
    if(u.settings&(USER_DELETED|USER_INACTIVE))
    continue;
     
     if(u.is_sysop) sysops++;
     
    // start new new loop and compare email addresses
    for(n = i+1; n <= lastuser; n++)
    {
	d = new User(n)
	if(u.number == d.number) continue;
	if(d.settings&(USER_DELETED|USER_INACTIVE)) continue;
	
	if(search == "netmail") { search1 = u.netmail; search2 = d.netmail; }
	if(search == "name") { search1 = u.name; search2 = d.name; }
	if(search == "alias") { search1 = u.alias; search2 = d.alias; }
	
	if(search1 == search2) 
	{
		//adds object to array for listing
		dup_list.push({number: u.number, num: u.number, alias: u.alias, email: u.netmail, d_num: d.number, d_alias: d.alias});
		if(!js.global.console) 	print(" [" + u.number + "] "+ u.alias + " <> " + "[" + d.number + "] " + d.alias + " (" + d.netmail + ")\r");
		else 	print(" \1g[\1y" + u.number + "\1g] \1w"+ u.alias + " \1g<> " + "[\1y" + d.number + "\1g] \1w" + d.alias + " \1g(\1c" + d.netmail + "\1g)\r");
		dups++;		
        }
    }
    
    recs++;
}

if(dups == 1) dup = "Entry"; else dup = "Entries"; // might as well be grammarically correct :)

if(js.global.console) {
	print("\r\n\1gScanned \1w" + recs + "\1g records. Found \1w" + dups + "\1g Duplicate \1w" + dup + "\1g!\r\n");
} else
{
	print("\r\nScanned " + recs + " records. Found " + dups + " Duplicate " + dup + "!\r\n");
}

if(dups == 0) 
{
	 done = true;
 	print("Your User Database is clear of duplicate " + lookFor + " Entries!\r\n\r\n");
 	mylog("Your User Database is clear of duplicate " + lookFor + " Entries!");
} else mylog("Scanned " + recs + " records. Found " + dups + " Duplicate " + lookFor + " " +dup + "!");

if(js.global.console) printf("Enter [\1yNumber\1g] [\1yS\1g] Switch Search Type or [\1yQ\1g]uit:  "); 
	else printf("Enter [Number] [S] Switch Search Type or [Q\]uit:  ");

if(js.global.console) lookup = console.getstr();
else lookup=readln();

if(lookup.toUpperCase() == "Q") 
{        
        done = true;
        exit;
}

if(lookup.toUpperCase() == "")
{
  if(js.global.console) print("\1cInvalid Option!\1g"); else { print("Invalid Option!");  mswait(2000); }
  done = false;
  continue;
}

if(lookup.toUpperCase() == "S") 
{
	if(js.global.console) printf("\r\n\r\n\1wSwitch Search Type to \1g[\1yA\1g] Alias [\1yN\1g] Name [\1yE\1g] Email : ");
		else  printf("\r\n\r\nSwitch Search Type to [A] Alias [N] Name [E] Email : "); 
	
	var old_lookFor = lookFor;
		
	new_lookup = readln();
	switch(new_lookup.toUpperCase()) {	
		case "A":
		search = "alias"; 
		lookFor = "Alias";
		var new_lookFor = "Alias";
		break;
		
		case "N":
		search = "name"; 
		lookFor = "Real Name";
		var new_lookFor = "Real Name";
		break;
		
		case "E":
		search = "netmail"; 
		lookFor = "Email";
		var new_lookFor = "Email";
		break;
	}
	
	if(js.global.console) print("\1wSwitching from \1y" + old_lookFor + "\1g to \1y" + lookFor + "\1g Comparisons ");	
		else print("Switching from " + old_lookFor + " to " + lookFor + " Comparisons ");	
	mylog("Switched Lookup Type from "+ old_lookFor + " to " + new_lookFor);
	mswait(2000);
	done = false;
	exit;
}

if(lookup.toUpperCase() != "Q" && lookup.toUpperCase() != "S") // solved a few issues in 0.1b
{ 
  	printf("Synchronet Duplicate " + lookFor + " Checker " + REVISION + "\r\n\r\n");
	
	if(lookup > lastuser || lookup == 0) {
	       if(js.global.console) print("\r\r\x1b[36mInvalid User Number ... Out of Range!");   
		else print("\r\rInvalid User Number ... Out of Range!");
		mylog("User #" + lookup + " Out of Range");
		mswait(2000);
		done = false;
		continue;
	}
		/* var x = 0;
		var is_there = false;
		print("shits n giggles dup_list has " + dup_list.legth + " entries");
		mswait(2000);
	  	for(x=0; x <= dup_list.length; x++) 
		{
	     		if(dup_list[x].num == lookup) is_there = true;    
	  	}
	   
	   if(!is_there) {
	      print("That User is not in the list ... aborting!");
	      done = false;
	      continue;
	   } */
	  
  	
	  
	printf("Loading Record #" + lookup);
  	var e = new User(lookup);
	mylog("Loading Record #" + lookup + " " + e.alias);    
  	print("\r\n");
  	
	if(js.global.console)
	{  
	print("\1wReal Name: \1y" + e.name);
  	print("\1wAlias    : \1y" + e.alias);
  	print("\1wLevel    : \1y" + e.security.level );
  	print("\1wEmail    : \1y" + e.netmail + "\1g");
	}
	else
	{  
	print("Real Name: " + e.name);
	print("Alias    : " + e.alias);
	print("Level    : " + e.security.level );
	print("Email    : " + e.netmail);
	}
	  
	if(e.is_sysop) print("         : SysOp Access");  
  	print("\r\n");

	if(e.is_sysop ) 
	{
			mylog("Not Editing SysOP: " + " " + e.alias);
		     	print("\r\nCannot Edit SysOP account, operation not permitted!");
			printf("\r\n<PRESS ENTER>");     
			readln();
	  		continue;
	}
		    	  
  	edit = confirm("Edit This User ");
  
  	if(edit == true) 
	  {			     
  		print("Edit User Record #" + lookup + "\r\n");
		if(js.global.console) print("\1g[\1yA\1g] Alias [\1yR\1g] Real Name [\1yE\1g] Email [\1yL\1g] Level [\1yD\1g] Delete [\1cQ\1g] Quit\r\n"); 
		else print("[A] Alias [R] Real Name [E] Email [L] Level [D] Delete [Q] Quit\r\n"); 
		printf("Which? ");  
		if(js.global.console) option = console.getstr();
		else option = readln(); 
		if(option == "") option = "Q";
	        opt = option.toUpperCase();
							 
		 
		switch (opt) 
		{
		  case "A": 
		  printf("New Alias ");
		  new_alias = readln();
		  do_it = confirm("Change "+ e.alias + " to " + new_alias + "? ");
		  if(do_it && new_alias != "") 
		  {
		    mylog("Changed Alais from " + e.alias + " to " + new_alias);
		    printf("New Alias set to " + new_alias);
		    e.alias = new_alias;		    
		    mswait(2000);		    
		    continue;
		  } else { 
		  		mylog("Aborted Alias Change");
		  		printf("Retaining Alias as " + e.alias); 
				mswait(2000); 
				continue; 
			}		  
		  break;
		  
		  case "R": 
		  printf("New Real Name ");
                  new_name = readln();
		  do_it = confirm("Change "+ e.name + " to " + new_name + "? ");
		  if(do_it && new_name != "") 
		  {
		    printf("New Name set to " + new_name);
		    mylog("Changed Name from " + e.name + " to " + new_name);
		    e.name = new_name;
		    mswait(2000);		    
		    continue;
		  } else { 
		  		mylog("Aborted Name Change"); 
				printf("Retaining Real Name as " + e.name); 
				mswait(2000); 
				continue; 
			 }
		  break;
		  
		  case "E": 
		  printf("New Email ");
		  new_email = readln();
		  do_it = confirm("Change "+ e.netmail + " to " + new_email + "? ");
		  if(do_it && new_email != "") 
		  {
		    mylog("Changed email from " + e.netmail + " to " + new_email);
		    printf("New Email set to " + new_email);
		    e.netmail = new_email;
		    mswait(2000);		    
		    continue;
		  } else { 
		  		mylog("Aborted Email Change"); 
				printf("Retaining Email as " + e.netmail);
				mswait(2000); 
				continue; 
			}			  
		  break;
		  
		  case "L": 
		  printf("New Level ");	
		  new_level = readln();
		  do_it = confirm("Change "+ e.security.level + " to " + new_level + "? ");
		  if(do_it && new_level != "") {
		     mylog("Changed Level from " + e.security.level + " to " + new_level);
		    printf("New Security Level set to " + new_level);
		    e.security.level = new_level;
		    mswait(2000);		    
		    continue;
		  } else {  mylog("Aborted Level Change"); printf("Retaining Security Level as " + e.security.level); mswait(2000); continue; }			  	  
		  break;		  
		  
		  case "D":		 
		  printf("Delete User ");
		  do_it = confirm("Delete User Account? ");
		  if(do_it) {
		     mylog("Deleted User #" + e.number + " " + e.alias + " " + e.name);		  
		    printf("User Account #" + e.number + " Deleted");
		    e.settings = USER_DELETED;
		    mswait(2000);		    
		    continue;
		  } else { mylog("Aborted Delete User");  printf("Aborting Action!"); mswait(2000); continue; }			  
		  break;
		  
		  case "Q": 
		  printf("Aborting!"); 		  
		  mswait(2000);				    
		}
		 
	mswait(1000);	   
  	} else {
	  	 mylog("Aborted Edit User # " + e.number + " " + e.alias + " " + e.name);
	  	print("Aborting ... " + e.alias);
		mswait(2000); 
	       }

  }
} // end main while !done

mylog("Program Exit! --------------------------------");

if(js.global.console) print("\1y\r\nCya ... ");
else print("\r\n\r\nExiting ... \r\n\r\n");
	